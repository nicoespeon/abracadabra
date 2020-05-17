import { Editor, Code, ErrorReason } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { Position } from "../../../editor/position";
import * as t from "../../../ast";
import {
  askReplacementStrategy,
  ReplacementStrategy
} from "../replacement-strategy";
import { renameSymbol } from "../../rename-symbol/rename-symbol";
import { last } from "../../../array-helpers";

export { extractGenericType };

async function extractGenericType(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const ast = t.parse(code);

  const {
    selected: selectedOccurrence,
    others: otherOccurrences
  } = findAllOccurrences(ast, selection);

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

  occurrences.forEach(occurrence => occurrence.transform());

  const anyOccurrence = occurrences[0];
  await editor.write(t.print(ast), anyOccurrence.symbolPosition);
  await renameSymbol(editor);
}

function findAllOccurrences(ast: t.AST, selection: Selection): AllOccurrences {
  let selectedOccurrence: Occurrence | null = null;
  let otherOccurrences: Occurrence[] = [];

  t.traverseAST(
    ast,
    createVisitor(
      selection,
      occurrence => (selectedOccurrence = occurrence),
      occurrence => otherOccurrences.push(occurrence)
    )
  );

  return {
    selected: selectedOccurrence,
    others: otherOccurrences.filter(
      occurrence =>
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

function createVisitor(
  selection: Selection,
  onMatch: (occurrence: Occurrence) => void,
  onVisit: (occurrence: Occurrence) => void = () => {}
): t.Visitor {
  return {
    TSTypeAnnotation(path) {
      if (!t.isSelectablePath(path)) return;

      const interfaceDeclaration = path.findParent(
        t.isTSInterfaceDeclaration
      ) as t.NodePath<t.TSInterfaceDeclaration> | null;
      if (!interfaceDeclaration) return;
      if (!selection.isInsidePath(interfaceDeclaration)) return;

      onVisit(new InterfaceOccurrence(path, interfaceDeclaration));
      if (!selection.isInsidePath(path)) return;

      onMatch(new SelectedInterfaceOccurrence(path, interfaceDeclaration));
    }
  };
}

interface Occurrence {
  readonly path: t.SelectablePath<t.TSTypeAnnotation>;
  readonly node: t.Selectable<t.TSTypeAnnotation>;
  readonly symbolPosition?: Position;

  transform(): void;
}

class InterfaceOccurrence implements Occurrence {
  readonly symbolPosition?: Position;
  protected readonly typeName: string;

  constructor(
    readonly path: t.SelectablePath<t.TSTypeAnnotation>,
    protected interfaceDeclaration: t.NodePath<t.TSInterfaceDeclaration>
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

  protected get existingTypeParameters(): t.TSTypeParameter[] {
    const NO_PARAMS: t.TSTypeParameter[] = [];
    const { typeParameters } = this.interfaceDeclaration.node;
    return (typeParameters && typeParameters.params) || NO_PARAMS;
  }

  private determineSymbolPosition(): Position | undefined {
    const lastTypeParameter = last(this.existingTypeParameters);
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
      const { id } = this.interfaceDeclaration.node;
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

    const existingNames = this.existingTypeParameters.map(({ name }) => name);
    const availableNames = VALID_NAMES.filter(
      name => !existingNames.includes(name)
    );

    return availableNames[0] || DEFAULT_NAME;
  }
}

class SelectedInterfaceOccurrence extends InterfaceOccurrence {
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

    this.interfaceDeclaration.node.typeParameters = t.tsTypeParameterDeclaration(
      [...this.existingTypeParameters, newTypeParameter]
    );
  }
}
