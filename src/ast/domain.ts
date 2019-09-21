import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export * from "@babel/types";
export {
  getStatements,
  replaceWithBodyOf,
  templateElement,
  Primitive,
  forEach
};

function getStatements(statement: t.Statement): t.Statement[] {
  return t.isBlockStatement(statement) ? statement.body : [statement];
}

function replaceWithBodyOf(path: NodePath, node: t.Statement) {
  path.replaceWithMultiple(getStatements(node));
}

/**
 * Override babel `templateElement()` because it exposes
 * unnecessary implementation details and it's not type-safe.
 */
function templateElement(value: string | number | boolean): t.TemplateElement {
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
