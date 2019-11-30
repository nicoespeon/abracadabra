import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

import { last } from "../array-helpers";

export {
  isClassPropertyIdentifier,
  isVariableDeclarationIdentifier,
  isFunctionCallIdentifier,
  isJSXPartialElement,
  isPartOfMemberExpression,
  isArrayExpressionElement,
  areAllObjectProperties,
  isUndefinedLiteral,
  isGuardClause,
  isGuardConsequentBlock,
  isNonEmptyReturn,
  hasFinalReturn,
  isTruthy,
  isFalsy,
  areEqual,
  isTemplateExpression,
  isInBranchedLogic,
  isInAlternate,
  areOpposite,
  areOppositeOperators,
  getOppositeOperator,
  canBeShorthand
};

function isClassPropertyIdentifier(path: NodePath): boolean {
  return (
    t.isClassProperty(path.parent) &&
    !path.parent.computed &&
    t.isIdentifier(path)
  );
}

function isVariableDeclarationIdentifier(path: NodePath): boolean {
  return t.isVariableDeclarator(path.parent) && t.isIdentifier(path);
}

function isFunctionCallIdentifier(path: NodePath): boolean {
  return t.isCallExpression(path.parent) && path.parent.callee === path.node;
}

function isJSXPartialElement(path: NodePath): boolean {
  return t.isJSXOpeningElement(path) || t.isJSXClosingElement(path);
}

function isPartOfMemberExpression(path: NodePath): boolean {
  return t.isMemberExpression(path.parent) && t.isIdentifier(path);
}

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
  const { consequent, alternate } = path.node;
  if (Boolean(alternate)) return false;

  return t.isReturnStatement(consequent) || isGuardConsequentBlock(consequent);
}

function isTruthy(test: t.Expression): boolean {
  return areEqual(test, t.booleanLiteral(true));
}

function isFalsy(test: t.Expression): boolean {
  return areEqual(test, t.booleanLiteral(false));
}

function isGuardConsequentBlock(
  consequent: t.IfStatement["consequent"]
): consequent is t.BlockStatement {
  return t.isBlockStatement(consequent) && hasFinalReturn(consequent.body);
}

function isNonEmptyReturn(node: t.Node) {
  return t.isReturnStatement(node) && node.argument !== null;
}

function hasFinalReturn(statements: t.Statement[]): boolean {
  return t.isReturnStatement(last(statements));
}

function areEqual(nodeA: t.Node | null, nodeB: t.Node | null): boolean {
  if (nodeA === null) return false;
  if (nodeB === null) return false;

  if (t.isNullLiteral(nodeA) && t.isNullLiteral(nodeB)) return true;
  if (isUndefinedLiteral(nodeA) && isUndefinedLiteral(nodeB)) return true;
  if (t.isThisExpression(nodeA) && t.isThisExpression(nodeB)) return true;

  // Arrays
  if (t.isArrayExpression(nodeA) && t.isArrayExpression(nodeB)) {
    return areAllEqual(nodeA.elements, nodeB.elements);
  }

  // Objects
  if (t.isObjectExpression(nodeA) && t.isObjectExpression(nodeB)) {
    return areAllEqual(nodeA.properties, nodeB.properties);
  }
  if (t.isObjectProperty(nodeA) && t.isObjectProperty(nodeB)) {
    return areEqual(nodeA.key, nodeB.key) && areEqual(nodeA.value, nodeB.value);
  }

  // Identifiers
  if (t.isIdentifier(nodeA) && t.isIdentifier(nodeB)) {
    return nodeA.name === nodeB.name;
  }

  // Functions
  if (
    t.isArrowFunctionExpression(nodeA) &&
    t.isArrowFunctionExpression(nodeB)
  ) {
    return areEqual(nodeA.body, nodeB.body);
  }

  // Call Expressions
  if (t.isCallExpression(nodeA) && t.isCallExpression(nodeB)) {
    return (
      areEqual(nodeA.callee, nodeB.callee) &&
      areAllEqual(nodeA.arguments, nodeB.arguments)
    );
  }

  // Binary & Logical Expressions
  if (
    (t.isLogicalExpression(nodeA) && t.isLogicalExpression(nodeB)) ||
    (t.isBinaryExpression(nodeA) && t.isBinaryExpression(nodeB))
  ) {
    return (
      nodeA.operator === nodeB.operator &&
      areEqual(nodeA.left, nodeB.left) &&
      areEqual(nodeA.right, nodeB.right)
    );
  }

  // Unary Expressions
  if (t.isUnaryExpression(nodeA) && t.isUnaryExpression(nodeB)) {
    return (
      nodeA.operator === nodeB.operator &&
      areEqual(nodeA.argument, nodeB.argument)
    );
  }

  // Member Expressions
  if (t.isMemberExpression(nodeA) && t.isMemberExpression(nodeB)) {
    return (
      areEqual(nodeA.property, nodeB.property) &&
      areEqual(nodeA.object, nodeB.object)
    );
  }

  // New Expressions
  if (t.isNewExpression(nodeA) && t.isNewExpression(nodeB)) {
    return (
      areEqual(nodeA.callee, nodeB.callee) &&
      areAllEqual(nodeA.arguments, nodeB.arguments)
    );
  }

  // JSX Elements
  if (t.isJSXElement(nodeA) && t.isJSXElement(nodeB)) {
    const areClosingElementsEqual =
      (nodeA.closingElement === null && nodeB.closingElement === null) ||
      areEqual(nodeA.closingElement, nodeB.closingElement);

    return (
      areEqual(nodeA.openingElement, nodeB.openingElement) &&
      areClosingElementsEqual &&
      areAllEqual(nodeA.children, nodeB.children)
    );
  }
  if (t.isJSXOpeningElement(nodeA) && t.isJSXOpeningElement(nodeB)) {
    return (
      areEqual(nodeA.name, nodeB.name) &&
      areAllEqual(nodeA.attributes, nodeB.attributes)
    );
  }
  if (t.isJSXClosingElement(nodeA) && t.isJSXClosingElement(nodeB)) {
    return areEqual(nodeA.name, nodeB.name);
  }
  if (t.isJSXAttribute(nodeA) && t.isJSXAttribute(nodeB)) {
    return (
      areEqual(nodeA.name, nodeB.name) && areEqual(nodeA.value, nodeB.value)
    );
  }
  if (t.isJSXIdentifier(nodeA) && t.isJSXIdentifier(nodeB)) {
    return nodeA.name === nodeB.name;
  }

  // Primitive values
  return "value" in nodeA && "value" in nodeB && nodeA.value === nodeB.value;
}

function areAllEqual(
  nodesA: (t.Node | null)[],
  nodesB: (t.Node | null)[]
): boolean {
  return (
    nodesA.length === nodesB.length &&
    nodesA.every((node, i) => areEqual(node, nodesB[i]))
  );
}

function isTemplateExpression(node: t.Node): node is TemplateExpression {
  return (
    t.isIdentifier(node) ||
    t.isCallExpression(node) ||
    t.isMemberExpression(node)
  );
}

type TemplateExpression = t.Identifier | t.CallExpression | t.MemberExpression;

function isInBranchedLogic(path: NodePath<t.ReturnStatement>) {
  return path.getAncestry().some(path => t.isIfStatement(path));
}

function isInAlternate(path: NodePath<t.IfStatement>): boolean {
  const { parentPath } = path;

  return t.isBlockStatement(parentPath)
    ? t.isIfStatement(parentPath.parent) &&
        parentPath.parent.alternate === path.parent
    : t.isIfStatement(parentPath.node) &&
        parentPath.node.alternate === path.node;
}

function areOpposite(testA: t.Expression, testB: t.Expression): boolean {
  if (!t.isBinaryExpression(testA)) return false;
  if (!t.isBinaryExpression(testB)) return false;

  const EQUALS_OPERATORS = ["==", "==="];

  if (
    EQUALS_OPERATORS.includes(testA.operator) &&
    EQUALS_OPERATORS.includes(testB.operator)
  ) {
    return (
      areEqual(testA.left, testB.left) && !areEqual(testA.right, testB.right)
    );
  }

  if (areOppositeOperators(testA.operator, testB.operator)) {
    return (
      areEqual(testA.left, testB.left) && areEqual(testA.right, testB.right)
    );
  }

  return false;
}

const OPPOSITE_OPERATORS: t.BinaryExpression["operator"][][] = [
  ["===", "!=="],
  ["==", "!="],
  [">", "<="],
  [">", "<"],
  [">=", "<"]
];

function areOppositeOperators(
  operatorA: t.BinaryExpression["operator"],
  operatorB: t.BinaryExpression["operator"]
): boolean {
  return OPPOSITE_OPERATORS.some(
    ([left, right]) =>
      (operatorA === left && operatorB === right) ||
      (operatorA === right && operatorB === left)
  );
}

function getOppositeOperator(
  operator: t.BinaryExpression["operator"]
): t.BinaryExpression["operator"] {
  let result: t.BinaryExpression["operator"] | undefined;

  OPPOSITE_OPERATORS.forEach(([left, right]) => {
    if (operator === left) result = right;
    if (operator === right) result = left;
  });

  return result || operator;
}

function canBeShorthand(path: NodePath): path is NodePath<t.ObjectProperty> {
  return t.isObjectProperty(path.node) && !path.node.computed;
}
