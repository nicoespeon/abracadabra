import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export * from "@babel/types";
export {
  getReturnedStatement,
  getAssignedStatement,
  getStatements,
  isEmpty,
  replaceWithBodyOf,
  templateElement,
  Primitive,
  forEach
};

function getReturnedStatement(
  node: t.Statement | null
): t.ReturnStatement | null {
  if (!t.isBlockStatement(node)) return null;

  const firstChild = node.body[0];
  if (!t.isReturnStatement(firstChild)) return null;

  return firstChild;
}

function getAssignedStatement(
  node: t.Statement | null
): t.ExpressionStatement & { expression: t.AssignmentExpression } | null {
  if (!t.isBlockStatement(node)) return null;
  if (node.body.length > 1) return null;

  const firstChild = node.body[0];
  if (!t.isExpressionStatement(firstChild)) return null;

  const expression = firstChild.expression;
  if (!t.isAssignmentExpression(expression)) return null;

  return { ...firstChild, expression };
}

function getStatements(statement: t.Statement): t.Statement[] {
  return t.isBlockStatement(statement) ? statement.body : [statement];
}

function isEmpty(statement: t.Statement): boolean {
  const statements = getStatements(statement).filter(
    child => child !== statement
  );

  return statements.length === 0;
}

function replaceWithBodyOf(path: NodePath, node: t.Statement) {
  path.replaceWithMultiple(getStatements(node));
}

/**
 * Override babel `templateElement()` because it exposes
 * unnecessary implementation details and it's not type-safe.
 */
function templateElement(value: string): t.TemplateElement {
  return t.templateElement({
    raw: value,
    cooked: value
  });
}

type Primitive =
  | t.StringLiteral
  | t.NumberLiteral
  | t.BooleanLiteral
  | t.BigIntLiteral;

function forEach(
  object: t.Expression,
  params: t.ArrowFunctionExpression["params"],
  body: t.BlockStatement
): t.ExpressionStatement {
  return t.expressionStatement(
    t.callExpression(t.memberExpression(object, t.identifier("forEach")), [
      t.arrowFunctionExpression(params, body)
    ])
  );
}
