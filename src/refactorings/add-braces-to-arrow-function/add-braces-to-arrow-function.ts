import { Code, Write } from "../../editor/i-write-code";
import { Selection } from "../../editor/selection";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import * as ast from "../../ast";

export { addBracesToArrowFunction, hasArrowFunctionToAddBraces };

async function addBracesToArrowFunction(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    showErrorMessage(ErrorReason.DidNotFoundArrowFunctionToAddBraces);
    return;
  }

  await write(updatedCode.code);
}

function hasArrowFunctionToAddBraces(
  code: Code,
  selection: Selection
): boolean {
  return updateCode(code, selection).hasCodeChanged;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    ArrowFunctionExpression(path) {
      if (!ast.isSelectableNode(path.node)) return;
      if (!selection.isInside(Selection.fromAST(path.node.loc))) return;
      if (ast.isBlockStatement(path.node.body)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const blockStatement = ast.blockStatement([
        ast.returnStatement(path.node.body)
      ]);
      path.node.body = blockStatement;
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
    ArrowFunctionExpression(childPath) {
      if (!ast.isSelectableNode(childPath.node)) return;
      if (!selection.isInside(Selection.fromAST(childPath.node.loc))) return;
      if (ast.isBlockStatement(childPath.node.body)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}
