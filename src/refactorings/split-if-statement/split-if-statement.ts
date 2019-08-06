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
      if (!selection.isInsidePath(path)) return;

      const { test, consequent, alternate } = path.node;
      if (!ast.isLogicalExpression(test)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      // Handle logical expressions in `else if` if they're closer to selection.
      if (hasAlternateWhichMatchesSelection(alternate, selection)) return;

      const splittedIfStatement = ast.ifStatement(
        test.right,
        consequent,
        alternate
      );

      if (test.operator === "&&") {
        path.node.consequent = ast.blockStatement([splittedIfStatement]);
      } else {
        path.node.alternate = splittedIfStatement;
      }
      path.node.test = test.left;

      path.stop();
    }
  });
}

function hasChildWhichMatchesSelection(
  path: ast.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    IfStatement(childPath) {
      if (!selection.isInsidePath(childPath)) return;
      if (!ast.isLogicalExpression(childPath.node.test)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

function hasAlternateWhichMatchesSelection(
  alternate: ast.IfStatement["alternate"],
  selection: Selection
): boolean {
  if (!ast.isIfStatement(alternate)) return false;
  if (!selection.isInsideNode(alternate)) return false;
  if (!ast.isLogicalExpression(alternate.test)) return false;

  return true;
}
