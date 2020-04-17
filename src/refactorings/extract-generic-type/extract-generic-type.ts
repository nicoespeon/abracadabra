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
    // TODO: implement the transformation here 🧙‍
  });
}
