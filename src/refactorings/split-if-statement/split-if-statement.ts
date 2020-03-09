import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { splitIfStatement, canSplitIfStatement };

async function splitIfStatement(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindIfStatementToSplit);
    return;
  }

  await editor.write(updatedCode.code);
}

function canSplitIfStatement(ast: t.AST, selection: Selection): boolean {
  let result = false;

  t.traverseAST(ast, {
    IfStatement(path) {
      if (!selection.isInsidePath(path)) return;

      const { test, alternate } = path.node;
      if (!t.isLogicalExpression(test)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      // Handle logical expressions in `else if` if they're closer to selection.
      if (hasAlternateWhichMatchesSelection(alternate, selection)) return;

      result = true;
    }
  });

  return result;
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(ast, {
    IfStatement(path) {
      if (!selection.isInsidePath(path)) return;

      const { test, consequent, alternate } = path.node;
      if (!t.isLogicalExpression(test)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      // Handle logical expressions in `else if` if they're closer to selection.
      if (hasAlternateWhichMatchesSelection(alternate, selection)) return;

      const splittedIfStatement = t.ifStatement(
        test.right,
        consequent,
        alternate
      );

      if (test.operator === "&&") {
        path.node.consequent = t.blockStatement([splittedIfStatement]);
      } else {
        path.node.alternate = splittedIfStatement;
      }
      path.node.test = test.left;

      path.stop();
    }
  });
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
