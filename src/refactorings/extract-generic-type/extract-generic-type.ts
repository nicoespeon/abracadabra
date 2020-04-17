import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { extractGenericType, createVisitor };

async function extractGenericType(
  code: Code,
  selection: Selection,
  editor: Editor
) {
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

function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.NodePath<t.TSTypeAnnotation>,
    typeName: string,
    typeAnnotation: t.TSTypeAnnotation
  ) => void
): t.Visitor {
  return {
    TSTypeAnnotation(path) {
      if (!selection.isInsidePath(path)) return;

      const genericTypeName = "T";
      const genericTypeAnnotation = t.tsTypeAnnotation(
        t.tsTypeReference(t.identifier(genericTypeName))
      );

      onMatch(path, genericTypeName, genericTypeAnnotation);
    }
  };
}
