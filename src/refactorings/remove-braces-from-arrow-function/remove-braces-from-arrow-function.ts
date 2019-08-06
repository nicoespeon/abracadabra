import { Code, Write } from "../../editor/i-write-code";
import { Selection } from "../../editor/selection";
import {
  ShowErrorMessage,
  ErrorReason
} from "../../editor/i-show-error-message";
import * as ast from "../../ast";

export { removeBracesFromArrowFunction, hasBracesToRemoveFromArrowFunction };

async function removeBracesFromArrowFunction(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) {
  const updatedCode = updateCode(code, selection);

  if (updatedCode.isPatternInvalid) {
    showErrorMessage(ErrorReason.CantRemoveBracesFromArrowFunction);
    return;
  }

  if (!updatedCode.hasCodeChanged) {
    showErrorMessage(ErrorReason.DidNotFoundBracesToRemoveFromArrowFunction);
    return;
  }

  await write(updatedCode.code);
}

function hasBracesToRemoveFromArrowFunction(
  code: Code,
  selection: Selection
): boolean {
  return updateCode(code, selection).hasCodeChanged;
}

function updateCode(
  code: Code,
  selection: Selection
): ast.Transformed & { isPatternInvalid: boolean } {
  let isPatternInvalid = false;

  const result = ast.transform(code, {
    ArrowFunctionExpression(path) {
      if (!selection.isInsidePath(path)) return;
      if (!ast.isBlockStatement(path.node.body)) return;

      const blockStatementStatements = path.node.body.body;
      if (blockStatementStatements.length > 1) {
        isPatternInvalid = true;
        return;
      }

      const firstValue = blockStatementStatements[0];
      if (!ast.isReturnStatement(firstValue)) {
        isPatternInvalid = true;
        return;
      }

      if (firstValue.argument === null) {
        isPatternInvalid = true;
        return;
      }

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      path.node.body = firstValue.argument;
      path.stop();
    }
  });

  return {
    ...result,
    isPatternInvalid
  };
}

function hasChildWhichMatchesSelection(
  path: ast.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    ArrowFunctionExpression(childPath) {
      if (!selection.isInsidePath(childPath)) return;
      if (!ast.isBlockStatement(childPath.node.body)) return;

      const blockStatementStatements = childPath.node.body.body;
      if (blockStatementStatements.length > 1) return;

      const firstValue = blockStatementStatements[0];
      if (!ast.isReturnStatement(firstValue)) return;
      if (firstValue.argument === null) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}
