import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { removeBracesFromArrowFunction, hasBracesToRemoveFromArrowFunction };

async function removeBracesFromArrowFunction(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (updatedCode.isPatternInvalid) {
    editor.showError(ErrorReason.CantRemoveBracesFromArrowFunction);
    return;
  }

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundBracesToRemoveFromArrowFunction);
    return;
  }

  await editor.write(updatedCode.code);
}

function hasBracesToRemoveFromArrowFunction(
  ast: t.AST,
  selection: Selection
): boolean {
  return updateCode(ast, selection).hasCodeChanged;
}

function updateCode(
  ast: t.AST,
  selection: Selection
): t.Transformed & { isPatternInvalid: boolean } {
  let isPatternInvalid = false;

  const result = t.transformAST(ast, {
    ArrowFunctionExpression(path) {
      if (!selection.isInsidePath(path)) return;
      if (!t.isBlockStatement(path.node.body)) return;

      const blockStatementStatements = path.node.body.body;
      if (blockStatementStatements.length > 1) {
        isPatternInvalid = true;
        return;
      }

      const firstValue = blockStatementStatements[0];
      if (!t.isReturnStatement(firstValue)) {
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
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    ArrowFunctionExpression(childPath) {
      if (!selection.isInsidePath(childPath)) return;
      if (!t.isBlockStatement(childPath.node.body)) return;

      const blockStatementStatements = childPath.node.body.body;
      if (blockStatementStatements.length > 1) return;

      const firstValue = blockStatementStatements[0];
      if (!t.isReturnStatement(firstValue)) return;
      if (firstValue.argument === null) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}
