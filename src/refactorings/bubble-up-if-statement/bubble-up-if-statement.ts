import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";

export { bubbleUpIfStatement, canBubbleUpIfStatement };

async function bubbleUpIfStatement(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundNestedIf);
    return;
  }

  await editor.write(updatedCode.code);
}

function canBubbleUpIfStatement(code: Code, selection: Selection): boolean {
  return updateCode(code, selection).hasCodeChanged;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    IfStatement(path) {
      const parentIfPath = ast.findParentIfPath(path);
      if (!parentIfPath) return;

      const parentTest = parentIfPath.node.test;
      parentIfPath.node.test = path.node.test;
      path.node.test = parentTest;
      path.stop();
    }
  });
}
