import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export {
  removeBracesFromArrowFunction,
  hasBracesToRemoveFromArrowFunctionVisitorFactory
};

async function removeBracesFromArrowFunction(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.isPatternValid) {
    editor.showError(ErrorReason.CantRemoveBracesFromArrowFunction);
    return;
  }

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundBracesToRemoveFromArrowFunction);
    return;
  }

  await editor.write(updatedCode.code);
}

function hasBracesToRemoveFromArrowFunctionVisitorFactory(
  selection: Selection,
  onMatch: (path: t.NodePath<any>) => void
): t.Visitor {
  return createVisitor(selection, path => {
    if (!selection.isInsidePath(path)) return;

    if (!t.isBlockStatement(path.node.body)) return;

    const blockStatementStatements = path.node.body.body;
    if (blockStatementStatements.length > 1) {
      return;
    }

    const firstValue = blockStatementStatements[0];
    if (!t.isReturnStatement(firstValue)) {
      return;
    }

    if (firstValue.argument === null) {
      return;
    }

    onMatch(path);
  });
}

function updateCode(
  ast: t.AST,
  selection: Selection
): t.Transformed & { isPatternValid: boolean } {
  let isPatternValid = true;

  const result = t.transformAST(
    ast,
    createVisitor(selection, path => {
      if (!t.isBlockStatement(path.node.body)) return;

      const blockStatementStatements = path.node.body.body;
      if (blockStatementStatements.length > 1) {
        isPatternValid = false;
        return;
      }

      const firstValue = blockStatementStatements[0];
      if (!t.isReturnStatement(firstValue)) {
        isPatternValid = false;
        return;
      }

      if (firstValue.argument === null) {
        isPatternValid = false;
        return;
      }

      path.node.body = firstValue.argument;
    })
  );

  return {
    ...result,
    isPatternValid
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

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.ArrowFunctionExpression>) => void
): t.Visitor {
  return {
    ArrowFunctionExpression(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      onMatch(path);
      path.stop();
    }
  };
}
