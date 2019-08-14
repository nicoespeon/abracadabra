import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export * from "@babel/types";
export {
  isArrayExpressionElement,
  areAllObjectProperties,
  isUndefinedLiteral,
  isTemplateExpression,
  isFunctionCallIdentifier,
  isClassPropertyIdentifier,
  isVariableDeclarationIdentifier,
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

function isTemplateExpression(node: t.Node): node is TemplateExpression {
  return (
    t.isIdentifier(node) ||
    t.isCallExpression(node) ||
    t.isMemberExpression(node)
  );
}

type TemplateExpression = t.Identifier | t.CallExpression | t.MemberExpression;

function isFunctionCallIdentifier(path: NodePath): boolean {
  return t.isCallExpression(path.parent) && path.parent.callee === path.node;
}

function isClassPropertyIdentifier(path: NodePath): boolean {
  return (
    t.isClassProperty(path.parent) &&
    !path.parent.computed &&
    t.isIdentifier(path.node)
  );
}

function isVariableDeclarationIdentifier(path: NodePath): boolean {
  return t.isVariableDeclarator(path.parent) && t.isIdentifier(path.node);
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
