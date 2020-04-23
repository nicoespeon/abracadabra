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

  await editor.write(t.print(ast), selectedOccurrence.start);
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
  readonly start?: Position;
  protected readonly typeName: string;

  constructor(readonly path: t.SelectablePath<t.TSTypeAnnotation>) {
    if (t.isSelectableNode(path.node.typeAnnotation)) {
      this.start = Position.fromAST(path.node.typeAnnotation.loc.start);
    }

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
    const { parent: interfaceDeclaration } = this.path.parentPath.parentPath;

    if (!t.isTSInterfaceDeclaration(interfaceDeclaration)) {
      return NO_PARAMS;
    }

    const { typeParameters } = interfaceDeclaration;
    return (typeParameters && typeParameters.params) || NO_PARAMS;
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
    const { parent: interfaceDeclaration } = this.path.parentPath.parentPath;

    if (t.isTSInterfaceDeclaration(interfaceDeclaration)) {
      const newTypeParameter = t.tsTypeParameter(
        undefined,
        this.path.node.typeAnnotation,
        this.typeName
      );

      interfaceDeclaration.typeParameters = t.tsTypeParameterDeclaration([
        ...this.existingTypeParameters,
        newTypeParameter
      ]);
    }
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
