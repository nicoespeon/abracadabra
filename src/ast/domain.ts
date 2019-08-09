import * as t from "@babel/types";

export * from "@babel/types";
export {
  isArrayExpressionElement,
  areAllObjectProperties,
  templateElement,
  isUndefinedLiteral,
  Primitive
};

// === AST DOMAIN ===

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

function isUndefinedLiteral(
  node: object | null | undefined,
  opts?: object | null
): node is t.Identifier {
  return t.isIdentifier(node, opts) && node.name === "undefined";
}

type Primitive =
  | t.StringLiteral
  | t.NumberLiteral
  | t.BooleanLiteral
  | t.BigIntLiteral;
