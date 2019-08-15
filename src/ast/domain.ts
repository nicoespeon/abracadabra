import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export * from "@babel/types";
export {
  isArrayExpressionElement,
  areAllObjectProperties,
  isUndefinedLiteral,
  isGuardClause,
  isGuardConsequentBlock,
  isEmptyReturn,
  isTemplateExpression,
  templateElement,
  Primitive
};

function isArrayExpressionElement(
  node: t.Node | null
): node is null | t.Expression | t.SpreadElement {
  return node === null || t.isExpression(node) || t.isSpreadElement(node);
}

function areAllObjectProperties(
  nodes: (t.Node | null)[]
): nodes is t.ObjectProperty[] {
  return nodes.every(node => t.isObjectProperty(node));
}

function isUndefinedLiteral(
  node: object | null | undefined,
  opts?: object | null
): node is t.Identifier {
  return t.isIdentifier(node, opts) && node.name === "undefined";
}

function isGuardClause(path: NodePath<t.IfStatement>) {
  const { consequent } = path.node;
  return t.isReturnStatement(consequent) || isGuardConsequentBlock(consequent);
}

function isGuardConsequentBlock(
  consequent: t.IfStatement["consequent"]
): consequent is t.BlockStatement {
  return (
    t.isBlockStatement(consequent) &&
    t.isReturnStatement(consequent.body[consequent.body.length - 1])
  );
}

function isEmptyReturn(node: t.Node) {
  return t.isReturnStatement(node) && node.argument === null;
}

function isTemplateExpression(node: t.Node): node is TemplateExpression {
  return (
    t.isIdentifier(node) ||
    t.isCallExpression(node) ||
    t.isMemberExpression(node)
  );
}

type TemplateExpression = t.Identifier | t.CallExpression | t.MemberExpression;

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
