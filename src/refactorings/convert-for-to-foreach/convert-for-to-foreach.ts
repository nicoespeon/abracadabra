import { singular } from "pluralize";

import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { convertForToForeach, createVisitor as canConvertForLoop };

async function convertForToForeach(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindForLoopToConvert);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(ast, createVisitor(selection));
}

function onMatchFor(
  path: t.NodePath<t.ForStatement>,
  accessor: t.Identifier,
  list: List
) {
  const { body } = path.node;

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

function onMatchForOf(
  path: t.NodePath<t.ForOfStatement>,
  identifier: t.Identifier | t.ObjectPattern | t.ArrayPattern,
  list: List
) {
  const { body } = path.node;

  const forEachBody = t.isBlockStatement(body)
    ? body
    : t.blockStatement([body]);
  const params = [identifier];

  path.replaceWith(t.forEach(list, params, forEachBody));

  path.stop();
}

function createVisitor(selection: Selection): t.Visitor {
  return {
    ForStatement(path) {
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      const { init, test } = path.node;
      if (!t.isBinaryExpression(test)) return;
      if (!t.isVariableDeclaration(init)) return;
      if (!startsFrom0(init)) return;

      const left = test.left;
      if (!t.isIdentifier(left)) return;

      const list = getList(test, init);
      if (!list) return;
      onMatchFor(path, left, list);
    },
    ForOfStatement(path) {
      if (!selection.isInsidePath(path)) return;

      const { left, right } = path.node;
      if (!t.isVariableDeclaration(left)) return;
      if (!isList(right, path)) return;
      const identifier = getIdentifier(left);
      if (!identifier) return;

      const list = right as List;
      onMatchForOf(path, identifier, list);

      return;
    }
  };
}

function isList(expression: t.Expression, path: t.NodePath<t.ForOfStatement>) {
  if (t.isArrayExpression(expression)) return true;
  if (!t.isIdentifier(expression)) return false;
  const identifier = expression as t.Identifier;
  return identifierPointsToArray(identifier.name, path);
}

function identifierPointsToArray(
  name: string,
  path: t.NodePath<t.ForOfStatement>
) {
  const binding = path.scope.getBinding(name);
  if (!binding) return false;
  const parent = binding.path.parent as t.VariableDeclaration;
  if (!t.isVariableDeclaration(parent)) return false;
  if (parent.declarations.length !== 1) return false;
  const value = parent.declarations[0].init;
  return t.isArrayExpression(value);
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
      if (!startsFrom0(init)) return;

      if (!t.isIdentifier(test.left)) return;

      if (!getList(test, init)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}

function startsFrom0({ declarations }: t.VariableDeclaration): boolean {
  const numeric0 = t.numericLiteral(0);

  return declarations.reduce<boolean>((result, { init }) => {
    if (t.isNumericLiteral(init) && !t.areEquivalent(init, numeric0)) {
      return false;
    }

    return result;
  }, true);
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
  if (!t.areEquivalent(property, t.identifier("length"))) return;
  if (!(t.isIdentifier(object) || t.isMemberExpression(object))) return;

  return object;
}

function getIdentifier(
  declaration: t.VariableDeclaration
): t.Identifier | t.ObjectPattern | t.ArrayPattern | undefined {
  // for...of doesn't support multiple declarations anyway.
  if (declaration.declarations.length !== 1) return;
  const id = declaration.declarations[0].id;
  if (!t.isIdentifier(id) && !t.isObjectPattern(id) && !t.isArrayPattern(id))
    return;
  return id;
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
        if (!t.areEquivalent(path.node.object, list)) return;
        if (!t.areEquivalent(path.node.property, accessor)) return;
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
      if (!t.areEquivalent(node, accessor)) return;
      result = true;
    }
  });

  return result;
}

type List = t.Identifier | t.MemberExpression;
