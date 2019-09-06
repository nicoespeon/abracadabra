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
      const parentAlternate = parentIfPath.node.alternate;

      parentIfPath.replaceWith(
        ast.ifStatement(
          path.node.test,
          parentIfPath.node.consequent,
          parentIfPath.node.alternate
        )
      );
      parentIfPath.stop();

      path.replaceWith(
        ast.ifStatement(parentTest, path.node.consequent, parentAlternate)
      );
      path.stop();
    }
  });
}
