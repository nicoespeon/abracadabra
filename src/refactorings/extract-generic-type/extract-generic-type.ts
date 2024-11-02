import { last } from "../../array";
import * as t from "../../ast";
import { Editor, ErrorReason } from "../../editor/editor";
import { Position } from "../../editor/position";
import { Selection } from "../../editor/selection";
import {
  askReplacementStrategy,
  ReplacementStrategy
} from "../extract/replacement-strategy";
import { renameSymbol } from "../rename-symbol/rename-symbol";

export async function extractGenericType(editor: Editor) {
  const { code, selection } = editor;
  const ast = t.parse(code);

  const { selected: selectedOccurrence, others: otherOccurrences } =
    findAllOccurrences(ast, selection);

  if (!selectedOccurrence) {
    editor.showError(ErrorReason.DidNotFindExtractableCode);
    return;
  }

  const choice = await askReplacementStrategy(otherOccurrences, editor);
  if (choice === ReplacementStrategy.None) return;

  const occurrences =
    choice === ReplacementStrategy.AllOccurrences
      ? [selectedOccurrence].concat(otherOccurrences)
      : [selectedOccurrence];

  occurrences.forEach((occurrence) => occurrence.transform());

  const anyOccurrence = occurrences[0];
  await editor.write(t.print(ast), anyOccurrence.symbolPosition);
  await renameSymbol(editor);
}

function findAllOccurrences(ast: t.AST, selection: Selection): AllOccurrences {
  let selectedOccurrence: Occurrence | null = null;
  const otherOccurrences: Occurrence[] = [];

  t.traverseAST(
    ast,
    createVisitor(
      selection,
      (occurrence) => (selectedOccurrence = occurrence),
      (occurrence) => otherOccurrences.push(occurrence)
    )
  );

  return {
    selected: selectedOccurrence,
    others: otherOccurrences.filter(
      (occurrence) =>
        selectedOccurrence &&
        t.areEquivalent(occurrence.node, selectedOccurrence.node) &&
        // Don't include the selected occurrence
        !Selection.areEqual(occurrence.path, selectedOccurrence.path)
    )
  };
}

interface AllOccurrences {
  selected: Occurrence | null;
  others: Occurrence[];
}

export function createVisitor(
  selection: Selection,
  onMatch: (occurrence: Occurrence) => void,
  onVisit: (occurrence: Occurrence) => void = () => {}
): t.Visitor {
  return {
    TSTypeAnnotation(path) {
      if (!t.isSelectablePath(path)) return;

      const interfaceDeclaration = findParentInterfaceDeclaration(path);
      const functionDeclaration = findParentFunctionDeclaration(path);

      if (interfaceDeclaration) {
        if (!interfaceDeclaration.contains(selection)) return;

        onVisit(new Occurrence(path, interfaceDeclaration));
        if (!selection.isInsidePath(path)) return;

        onMatch(new SelectedOccurrence(path, interfaceDeclaration));
      } else if (functionDeclaration) {
        if (!functionDeclaration.contains(selection)) return;

        onVisit(new Occurrence(path, functionDeclaration));
        if (!selection.isInsidePath(path)) return;

        onMatch(new SelectedOccurrence(path, functionDeclaration));
      }
    }
  };
}

function findParentInterfaceDeclaration(
  path: t.SelectablePath<t.TSTypeAnnotation>
): InterfaceDeclaration | null {
  const declaration = path.findParent(
    t.isTSInterfaceDeclaration
  ) as t.NodePath<t.TSInterfaceDeclaration>;
  return declaration ? new InterfaceDeclaration(declaration) : null;
}

function findParentFunctionDeclaration(
  path: t.SelectablePath<t.TSTypeAnnotation>
): FunctionDeclaration | null {
  const declaration = path.findParent(
    t.isFunctionDeclaration
  ) as t.NodePath<t.FunctionDeclaration>;
  return declaration ? new FunctionDeclaration(declaration) : null;
}

export class Occurrence {
  readonly symbolPosition?: Position;
  protected readonly typeName: string;

  constructor(
    readonly path: t.SelectablePath<t.TSTypeAnnotation>,
    protected declaration: Declaration
  ) {
    this.symbolPosition = this.determineSymbolPosition();
    this.typeName = this.computeValidTypeName();
  }

  get node(): t.Selectable<t.TSTypeAnnotation> {
    return this.path.node;
  }

  transform() {
    const typeAnnotation = t.tsTypeAnnotation(
      t.tsTypeReference(t.identifier(this.typeName))
    );
    this.path.replaceWith(typeAnnotation);
  }

  private determineSymbolPosition(): Position | undefined {
    const lastTypeParameter = last(this.declaration.existingTypeParameters);
    if (lastTypeParameter) {
      if (!t.isSelectableNode(lastTypeParameter)) return;

      /**
       * interface Position<T = number> {
       *                             ^−−−− end of last type param
       *
       * interface Position<T = number, U = string> {
       *                               ^−−−− end of last type param + 2
       */
      return Position.fromAST(lastTypeParameter.loc.end).addCharacters(2);
    } else {
      const { id } = this.declaration;
      if (!t.isSelectableNode(id)) return;

      /**
       * interface Position {
       *                   ^−−−− end of ID
       *
       * interface Position<T = number> {
       *                   ^−−−− end of ID + 1
       */
      return Position.fromAST(id.loc.end).addCharacters(1);
    }
  }

  private computeValidTypeName(): string {
    const DEFAULT_NAME = "T";
    const VALID_NAMES = [DEFAULT_NAME, "U", "V", "W", "X", "Y", "Z"];

    const existingNames = this.declaration.existingTypeParameters.map(
      ({ name }) => name
    );
    const availableNames = VALID_NAMES.filter(
      (name) => !existingNames.includes(name)
    );

    return availableNames[0] || DEFAULT_NAME;
  }
}

class SelectedOccurrence extends Occurrence {
  transform() {
    this.addGenericDeclaration();
    super.transform();
  }

  private addGenericDeclaration() {
    const newTypeParameter = t.tsTypeParameter(
      undefined,
      this.path.node.typeAnnotation,
      this.typeName
    );

    this.declaration.setTypeParameters(
      t.tsTypeParameterDeclaration([
        ...this.declaration.existingTypeParameters,
        newTypeParameter
      ])
    );
  }
}

interface Declaration {
  existingTypeParameters: t.TSTypeParameter[];
  id: t.Identifier | null;
  contains(selection: Selection): boolean;
  setTypeParameters(params: t.TSTypeParameterDeclaration): void;
}

class InterfaceDeclaration implements Declaration {
  constructor(
    private readonly declaration: t.NodePath<t.TSInterfaceDeclaration>
  ) {}

  get existingTypeParameters(): t.TSTypeParameter[] {
    const NO_PARAMS: t.TSTypeParameter[] = [];
    const { typeParameters } = this.declaration.node;
    return (typeParameters && typeParameters.params) || NO_PARAMS;
  }

  get id(): t.Identifier | null {
    return this.declaration.node.id;
  }

  contains(selection: Selection): boolean {
    return selection.isInsidePath(this.declaration);
  }

  setTypeParameters(params: t.TSTypeParameterDeclaration): void {
    this.declaration.node.typeParameters = params;
  }
}

class FunctionDeclaration implements Declaration {
  constructor(
    private readonly declaration: t.NodePath<t.FunctionDeclaration>
  ) {}

  get existingTypeParameters(): t.TSTypeParameter[] {
    const NO_PARAMS: t.TSTypeParameter[] = [];
    const { typeParameters } = this.declaration.node;
    return (
      (t.isTSTypeParameterDeclaration(typeParameters) &&
        typeParameters.params) ||
      NO_PARAMS
    );
  }

  get id(): t.Identifier | null {
    return this.declaration.node.id ?? null;
  }

  contains(selection: Selection): boolean {
    return selection.isInsidePath(this.declaration);
  }

  setTypeParameters(params: t.TSTypeParameterDeclaration): void {
    this.declaration.node.typeParameters = params;
  }
}
