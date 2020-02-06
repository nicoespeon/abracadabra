import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { extractGenericType, hasTypeToExtract };

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

function hasTypeToExtract(ast: t.AST, selection: Selection): boolean {
  // TODO: implement the check here 🧙‍
  return false;
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(ast, {
    TSTypeAnnotation(path) {
      if (!selection.isInsidePath(path)) return;

      const genericTypeAnnotation = t.tsTypeAnnotation(
        t.tsTypeReference(t.identifier("T"))
      );
      if (t.isTSInterfaceDeclaration(path.parentPath.parentPath.parent)) {
        const typeParameter = t.tsTypeParameter(undefined, t.tsNumberKeyword());
        typeParameter.name = "T";
        path.parentPath.parentPath.parent.typeParameters = t.tsTypeParameterDeclaration(
          [typeParameter]
        );
      }
      path.replaceWith(genericTypeAnnotation);

      path.stop();
    }
  });
}
