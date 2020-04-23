import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { Position } from "../../editor/position";
import * as t from "../../ast";
import {
  askReplacementStrategy,
  ReplacementStrategy
} from "../../replacement-strategy";
import { renameSymbol } from "../rename-symbol/rename-symbol";

export { extractGenericType, createVisitor };

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
    editor.showError(ErrorReason.DidNotFindTypeToExtract);
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
      path => (selectedOccurrence = new SelectedOccurrence(path)),
      path => otherOccurrences.push(new Occurrence(path))
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

class Occurrence {
  readonly symbolPosition?: Position;
  protected readonly typeName: string;

  constructor(readonly path: t.SelectablePath<t.TSTypeAnnotation>) {
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

    const interfaceDeclaration = this.getInterfaceDeclaration();
    if (!interfaceDeclaration) return NO_PARAMS;

    const { typeParameters } = interfaceDeclaration.node;
    return (typeParameters && typeParameters.params) || NO_PARAMS;
  }

  protected getInterfaceDeclaration(): t.NodePath<
    t.TSInterfaceDeclaration
  > | null {
    return this.path.findParent(t.isTSInterfaceDeclaration) as t.NodePath<
      t.TSInterfaceDeclaration
    > | null;
  }

  private determineSymbolPosition(): Position | undefined {
    const interfaceDeclaration = this.getInterfaceDeclaration();
    if (!interfaceDeclaration) return;

    const { id } = interfaceDeclaration.node;
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

class SelectedOccurrence extends Occurrence {
  transform() {
    this.addGenericDeclaration();
    super.transform();
  }

  private addGenericDeclaration() {
    const interfaceDeclaration = this.getInterfaceDeclaration();
    if (!interfaceDeclaration) return;

    const newTypeParameter = t.tsTypeParameter(
      undefined,
      this.path.node.typeAnnotation,
      this.typeName
    );

    interfaceDeclaration.node.typeParameters = t.tsTypeParameterDeclaration([
      ...this.existingTypeParameters,
      newTypeParameter
    ]);
  }
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.SelectablePath<t.TSTypeAnnotation>) => void,
  onVisit: (path: t.SelectablePath<t.TSTypeAnnotation>) => void = () => {}
): t.Visitor {
  return {
    TSTypeAnnotation(path) {
      if (!t.isSelectablePath(path)) return;

      onVisit(path);
      if (!selection.isInsidePath(path)) return;

      onMatch(path);
    }
  };
}
