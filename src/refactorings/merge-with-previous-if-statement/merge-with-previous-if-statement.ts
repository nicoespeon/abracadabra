import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { mergeWithPreviousIfStatement, canMergeWithPreviousIf };

async function mergeWithPreviousIfStatement(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindStatementToMerge);
    return;
  }

  await editor.write(updatedCode.code);
}

function canMergeWithPreviousIf(ast: t.AST, selection: Selection): boolean {
  let result = false;

  t.traverseAST(
    ast,
    createVisitor(selection, () => {
      result = true;
    })
  );

  return result;
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path: t.NodePath<t.Statement>) => {
      const previousSibling = t.getPreviousSibling(path);
      if (!previousSibling) return;

      const previousNode = previousSibling.node;
      if (!t.isIfStatement(previousNode)) return;

      mergeWithIfStatement(previousNode, path.node);

      path.remove();
      path.stop();
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.Statement>) => void
): t.Visitor {
  return {
    Statement(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const previousSibling = t.getPreviousSibling(path);
      if (!previousSibling) return;

      const previousNode = previousSibling.node;
      if (!t.isIfStatement(previousNode)) return;

      onMatch(path);
    }
  };
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    Statement(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      const previousSibling = t.getPreviousSibling(childPath);
      if (!previousSibling) return;

      const previousNode = previousSibling.node;
      if (!t.isIfStatement(previousNode)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

function mergeWithIfStatement(ifStatement: t.IfStatement, node: t.Statement) {
  if (t.isIfStatement(node) && t.areEqual(ifStatement.test, node.test)) {
    mergeIfStatementWithIfStatement(ifStatement, node);
  } else {
    mergeStatementWithIfStatement(ifStatement, node);
  }
}

function mergeIfStatementWithIfStatement(
  ifStatement: t.IfStatement,
  node: t.IfStatement
) {
  const { consequent, alternate } = ifStatement;

  ifStatement.consequent = mergeWith(
    consequent,
    t.getStatements(node.consequent)
  );

  if (!node.alternate) return;

  const nodesToMerge = t.getStatements(node.alternate);

  if (t.isIfStatement(alternate)) {
    nodesToMerge.forEach(node => mergeWithIfStatement(alternate, node));
  } else {
    ifStatement.alternate = alternate
      ? mergeWith(alternate, nodesToMerge)
      : node.alternate;
  }
}

function mergeStatementWithIfStatement(
  ifStatement: t.IfStatement,
  node: t.Statement
) {
  const { consequent, alternate } = ifStatement;

  ifStatement.consequent = mergeWith(consequent, [node]);

  if (!alternate) return;

  if (t.isIfStatement(alternate)) {
    mergeWithIfStatement(alternate, node);
  } else {
    ifStatement.alternate = mergeWith(alternate, [node]);
  }
}

function mergeWith(
  branch: t.Statement,
  statements: t.Statement[]
): t.BlockStatement {
  return t.blockStatement([...t.getStatements(branch), ...statements]);
}
