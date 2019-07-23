import { Code, Write } from "../../editor/i-write-code";
import { Selection } from "../../editor/selection";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import * as ast from "../../ast";

export { splitIfStatement, canSplitIfStatement };

async function splitIfStatement(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    showErrorMessage(ErrorReason.DidNotFoundIfStatementToSplit);
    return;
  }

  await write(updatedCode.code);
}

function canSplitIfStatement(code: Code, selection: Selection): boolean {
  return updateCode(code, selection).hasCodeChanged;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    IfStatement(path) {
      if (!ast.isSelectableNode(path.node)) return;
      if (!selection.isInside(Selection.fromAST(path.node.loc))) return;

      const test = path.node.test;
      if (!ast.isLogicalExpression(test)) return;

      path.node.test = test.left;
      path.node.consequent = ast.blockStatement([
        ast.ifStatement(test.right, path.node.consequent)
      ]);

      path.stop();
    }
  });
}
