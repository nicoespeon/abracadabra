import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { splitIfStatement, createVisitor as canSplitIfStatement };

async function splitIfStatement(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundIfStatementToSplit);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path: t.NodePath<t.IfStatement>) => {
      const { test, consequent, alternate } = path.node;

      const logicalExpression = test as t.LogicalExpression;

      const splittedIfStatement = t.ifStatement(
        logicalExpression.right,
        consequent,
        alternate
      );

      if (logicalExpression.operator === "&&") {
        path.node.consequent = t.blockStatement([splittedIfStatement]);
      } else {
        path.node.alternate = splittedIfStatement;
      }
      path.node.test = logicalExpression.left;

      path.stop();
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.IfStatement>) => void
): t.Visitor {
  return {
    IfStatement(path) {
      if (!selection.isInsidePath(path)) return;

      const { test, alternate } = path.node;
      if (!t.isLogicalExpression(test)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      // Handle logical expressions in `else if` if they're closer to selection.
      if (hasAlternateWhichMatchesSelection(alternate, selection)) return;

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
    IfStatement(childPath) {
      if (!selection.isInsidePath(childPath)) return;
      if (!t.isLogicalExpression(childPath.node.test)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

function hasAlternateWhichMatchesSelection(
  alternate: t.IfStatement["alternate"],
  selection: Selection
): boolean {
  if (!t.isIfStatement(alternate)) return false;
  if (!selection.isInsideNode(alternate)) return false;
  if (!t.isLogicalExpression(alternate.test)) return false;

  return true;
}
