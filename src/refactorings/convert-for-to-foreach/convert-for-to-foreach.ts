import { singular } from "pluralize";

import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { convertForToForeach, canConvertForLoop };

async function convertForToForeach(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundForLoopToConvert);
    return;
  }

  await editor.write(updatedCode.code);
}

function canConvertForLoop(ast: t.AST, selection: Selection): boolean {
  let result = false;

  t.traverseAST(ast, {
    ForStatement(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const { init, test } = path.node;
      if (!t.isBinaryExpression(test)) return;
      if (!t.isVariableDeclaration(init)) return;

      const left = test.left;
      if (!t.isIdentifier(left)) return;

      const list = getList(test, init);
      if (!list) return;

      result = true;
    }
  });

  return result;
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(ast, {
    ForStatement(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const { init, test, body } = path.node;
      if (!t.isBinaryExpression(test)) return;
      if (!t.isVariableDeclaration(init)) return;

      const left = test.left;
      if (!t.isIdentifier(left)) return;

      const list = getList(test, init);
      if (!list) return;

      const accessor = left;
      const item = t.identifier(singular(getListName(list)));
      const forEachBody = t.isBlockStatement(body)
        ? body
        : t.blockStatement([body]);

      replaceListWithItemIn(forEachBody, list, accessor, item, path.scope);

      // After we replaced, we check if there are remaining accessors.
      const params = isAccessorReferencedIn(forEachBody, accessor)
        ? [item, accessor]
        : [item];

      path.replaceWith(t.forEach(list, params, forEachBody));
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
    ForStatement(childPath) {
      if (!selection.isInsidePath(childPath)) return;

      const { init, test } = childPath.node;
      if (!t.isBinaryExpression(test)) return;
      if (!t.isVariableDeclaration(init)) return;

      if (!t.isIdentifier(test.left)) return;

      if (!getList(test, init)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

function getList(
  expression: t.BinaryExpression,
  variableDeclaration: t.VariableDeclaration
): List | undefined {
  return (
    getListFromBinaryExpression(expression) ||
    getListFromVariableDeclaration(variableDeclaration)
  );
}

function getListFromBinaryExpression(
  expression: t.BinaryExpression
): List | undefined {
  const { right } = expression;

  return t.isBinaryExpression(right)
    ? getListFromMemberExpression(right.left)
    : getListFromMemberExpression(right);
}

function getListFromVariableDeclaration(
  variableDeclaration: t.VariableDeclaration
): List | undefined {
  let result: List | undefined;

  variableDeclaration.declarations.forEach(({ init }) => {
    if (t.isBinaryExpression(init)) {
      result = getListFromMemberExpression(init.left);
    }
  });

  return result;
}

function getListFromMemberExpression(node: t.Node): List | undefined {
  if (!t.isMemberExpression(node)) return;

  const { object, property } = node;
  if (!t.areEqual(property, t.identifier("length"))) return;
  if (!(t.isIdentifier(object) || t.isMemberExpression(object))) return;

  return object;
}

function getListName(list: List): string {
  return t.isIdentifier(list) ? list.name : getListName(list.property);
}

function replaceListWithItemIn(
  statement: t.BlockStatement,
  list: List,
  accessor: t.Identifier,
  item: t.Identifier,
  scope: t.Scope
) {
  t.traversePath(
    statement,
    {
      MemberExpression(path) {
        if (!t.areEqual(path.node.object, list)) return;
        if (!t.areEqual(path.node.property, accessor)) return;
        path.replaceWith(item);
      }
    },
    scope
  );
}

function isAccessorReferencedIn(
  statement: t.BlockStatement,
  accessor: t.Identifier
): boolean {
  let result = false;

  t.traverseNode(statement, {
    enter(node) {
      if (!t.areEqual(node, accessor)) return;
      result = true;
    }
  });

  return result;
}

type List = t.Identifier | t.MemberExpression;
