import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";
import { askReplacementStrategy } from "../../replacement-strategy";

export { extractGenericType, createVisitor };

async function extractGenericType(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const { others: otherOccurrences } = findAllOccurrences(
    t.parse(code),
    selection
  );
  await askReplacementStrategy(otherOccurrences, editor);

  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindTypeToExtract);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path, typeName, typeAnnotation) => {
      if (t.isTSInterfaceDeclaration(path.parentPath.parentPath.parent)) {
        const typeParameter = t.tsTypeParameter(
          undefined,
          path.node.typeAnnotation,
          typeName
        );

        path.parentPath.parentPath.parent.typeParameters = t.tsTypeParameterDeclaration(
          [typeParameter]
        );
      }

      path.replaceWith(typeAnnotation);
      path.stop();
    })
  );
}

function findAllOccurrences(ast: t.AST, selection: Selection): AllOccurrences {
  let selectedOccurrence: Occurrence | null = null;
  let otherOccurrences: Occurrence[] = [];

  t.transformAST(
    ast,
    createVisitor(
      selection,
      path => (selectedOccurrence = path),
      path => otherOccurrences.push(path)
    )
  );

  return {
    selected: selectedOccurrence,
    others: otherOccurrences.filter(
      occurrence =>
        selectedOccurrence &&
        t.areEqual(occurrence.node, selectedOccurrence.node) &&
        // Don't include the selected occurrence
        !Selection.areEqual(occurrence, selectedOccurrence)
    )
  };
}

interface AllOccurrences {
  selected: Occurrence | null;
  others: Occurrence[];
}

type Occurrence = t.SelectablePath<t.TSTypeAnnotation>;

function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.SelectablePath<t.TSTypeAnnotation>,
    typeName: string,
    typeAnnotation: t.TSTypeAnnotation
  ) => void,
  onVisit: (path: t.SelectablePath<t.TSTypeAnnotation>) => void = () => {}
): t.Visitor {
  return {
    TSTypeAnnotation(path) {
      if (!t.isSelectablePath(path)) return;

      onVisit(path);
      if (!selection.isInsidePath(path)) return;

      const genericTypeName = "T";
      const genericTypeAnnotation = t.tsTypeAnnotation(
        t.tsTypeReference(t.identifier(genericTypeName))
      );

      onMatch(path, genericTypeName, genericTypeAnnotation);
    }
  };
}
