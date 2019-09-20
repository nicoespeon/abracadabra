import { singular } from "pluralize";

import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";

export { convertForToForeach, canConvertForLoop };

async function convertForToForeach(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundForLoopToConvert);
    return;
  }

  await editor.write(updatedCode.code);
}

function canConvertForLoop(code: Code, selection: Selection): boolean {
  return updateCode(code, selection).hasCodeChanged;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    ForStatement(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const { init, test, body } = path.node;
      if (!ast.isBinaryExpression(test)) return;
      if (!ast.isVariableDeclaration(init)) return;

      const left = test.left;
      if (!ast.isIdentifier(left)) return;

      const list = getList(test, init);
      if (!list) return;

      const accessor = left;
      const item = ast.identifier(singular(getListName(list)));
      const forEachBody = ast.isBlockStatement(body)
        ? body
        : ast.blockStatement([body]);

      replaceListWithItemIn(forEachBody, list, accessor, item, path.scope);

      // After we replaced, we check if there are remaining accessors.
      const params = isAccessorReferencedIn(forEachBody, accessor)
        ? [item, accessor]
        : [item];

      path.replaceWith(ast.forEach(list, params, forEachBody));
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
    ForStatement(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      const { init, test } = childPath.node;
      if (!ast.isBinaryExpression(test)) return;
      if (!ast.isVariableDeclaration(init)) return;

      if (!ast.isIdentifier(test.left)) return;

      if (!getList(test, init)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

function getList(
  expression: ast.BinaryExpression,
  variableDeclaration: ast.VariableDeclaration
): List | undefined {
  return (
    getListFromBinaryExpression(expression) ||
    getListFromVariableDeclaration(variableDeclaration)
  );
}

function getListFromBinaryExpression(
  expression: ast.BinaryExpression
): List | undefined {
  const { right } = expression;

  return ast.isBinaryExpression(right)
    ? getListFromMemberExpression(right.left)
    : getListFromMemberExpression(right);
}

function getListFromVariableDeclaration(
  variableDeclaration: ast.VariableDeclaration
): List | undefined {
  let result: List | undefined;

  variableDeclaration.declarations.forEach(({ init }) => {
    if (ast.isBinaryExpression(init)) {
      result = getListFromMemberExpression(init.left);
    }
  });

  return result;
}

function getListFromMemberExpression(node: ast.Node): List | undefined {
  if (!ast.isMemberExpression(node)) return;

  const { object, property } = node;
  if (!ast.areEqual(property, ast.identifier("length"))) return;
  if (!(ast.isIdentifier(object) || ast.isMemberExpression(object))) return;

  return object;
}

function getListName(list: List): string {
  return ast.isIdentifier(list) ? list.name : getListName(list.property);
}

function replaceListWithItemIn(
  statement: ast.BlockStatement,
  list: List,
  accessor: ast.Identifier,
  item: ast.Identifier,
  scope: ast.Scope
) {
  ast.traversePath(
    statement,
    {
      MemberExpression(path) {
        if (!ast.areEqual(path.node.object, list)) return;
        if (!ast.areEqual(path.node.property, accessor)) return;
        path.replaceWith(item);
      }
    },
    scope
  );
}

function isAccessorReferencedIn(
  statement: ast.BlockStatement,
  accessor: ast.Identifier
): boolean {
  let result = false;

  ast.traverseNode(statement, {
    enter(node) {
      if (!ast.areEqual(node, accessor)) return;
      result = true;
    }
  });

  return result;
}

type List = ast.Identifier | ast.MemberExpression;
