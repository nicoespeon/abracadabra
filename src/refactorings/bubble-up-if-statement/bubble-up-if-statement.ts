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
      const { node } = path;

      const parentIfPath = ast.findParentIfPath(path);
      if (!parentIfPath) return;

      const parentIf = parentIfPath.node;
      const parentTest = parentIf.test;
      const parentAlternate = parentIf.alternate;

      const newParentIfAlternate = node.alternate
        ? ast.blockStatement([
            ast.ifStatement(parentTest, node.alternate, parentAlternate)
          ])
        : parentIf.alternate;

      parentIfPath.replaceWith(
        ast.ifStatement(node.test, parentIf.consequent, newParentIfAlternate)
      );
      parentIfPath.stop();

      path.replaceWith(
        ast.ifStatement(parentTest, node.consequent, parentAlternate)
      );
      path.stop();
    }
  });
}
