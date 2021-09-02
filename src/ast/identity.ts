import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

import { last } from "../array";
import { Selection } from "../editor/selection";
import { isSelectableNode, SelectablePath } from "./selection";

export {
  isClassPropertyIdentifier,
  isVariableDeclarationIdentifier,
  isFunctionDeclarationOrArrowFunction,
  isFunctionCallIdentifier,
  isJSXPartialElement,
  isPropertyOfMemberExpression,
  isArrayExpressionElement,
  areAllObjectProperties,
  isUndefinedLiteral,
  isGuardClause,
  isGuardConsequentBlock,
  isNonEmptyReturn,
  hasFinalReturn,
  hasBraces,
  IfStatementWithAlternate,
  hasAlternate,
  hasSingleStatementBlock,
  isTruthy,
  isFalsy,
  areSameAssignments,
  areEquivalent,
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

function isFunctionDeclarationOrArrowFunction(
  node: t.Node
): node is t.FunctionDeclaration | t.ArrowFunctionExpression {
  return t.isFunctionDeclaration(node) || t.isArrowFunctionExpression(node);
}

function isFunctionCallIdentifier(path: NodePath): boolean {
  return t.isCallExpression(path.parent) && path.parent.callee === path.node;
}

function isJSXPartialElement(path: NodePath): boolean {
  return t.isJSXOpeningElement(path) || t.isJSXClosingElement(path);
}

function isPropertyOfMemberExpression(path: NodePath): boolean {
  return (
    (t.isMemberExpression(path.parent) ||
      t.isOptionalMemberExpression(path.parent)) &&
    t.isIdentifier(path) &&
    !areEquivalent(path.node, path.parent.object)
  );
}

function isArrayExpressionElement(
  node: t.Node | null
): node is null | t.Expression | t.SpreadElement {
  return node === null || t.isExpression(node) || t.isSpreadElement(node);
}

function areAllObjectProperties(
  nodes: (t.Node | null)[]
): nodes is t.ObjectProperty[] {
  return nodes.every((node) => t.isObjectProperty(node));
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
  return areEquivalent(test, t.booleanLiteral(true));
}

function isFalsy(test: t.Expression): boolean {
  return areEquivalent(test, t.booleanLiteral(false));
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

function hasBraces(
  path: SelectablePath<t.IfStatement>,
  selection: Selection
): boolean {
  const { consequent, alternate } = path.node;
  const ifSelection = Selection.fromAST(path.node.loc);
  const consequentSelection = isSelectableNode(consequent)
    ? Selection.fromAST(consequent.loc)
    : selection;
  const ifAndConsequentSelection =
    consequentSelection.extendStartToStartOf(ifSelection);

  if (selection.isInside(ifAndConsequentSelection)) {
    return t.isBlockStatement(consequent);
  } else {
    return alternate === null || t.isBlockStatement(alternate);
  }
}

type IfStatementWithAlternate = t.IfStatement & { alternate: t.Statement };

function hasAlternate(
  path: NodePath<t.IfStatement>
): path is NodePath<IfStatementWithAlternate> {
  return Boolean(path.node.alternate);
}

function hasSingleStatementBlock(
  path: NodePath<t.IfStatement>,
  selection: Selection
): boolean {
  const { consequent, alternate } = path.node;
  const selectedBranchNode =
    isSelectableNode(consequent) && selection.isBefore(consequent)
      ? consequent
      : alternate;

  if (!selectedBranchNode) return false;

  if (t.isBlockStatement(selectedBranchNode)) {
    return selectedBranchNode.body.length < 2;
  } else {
    return false;
  }
}

function areSameAssignments(
  expressionA: t.AssignmentExpression,
  expressionB: t.AssignmentExpression
): boolean {
  return (
    areEquivalent(expressionA.left, expressionB.left) &&
    expressionA.operator === expressionB.operator
  );
}

function areEquivalent(
  nodeA: t.Node | null | undefined,
  nodeB: t.Node | null | undefined
): boolean {
  if (nodeA === null || nodeA === undefined) return nodeA === nodeB;
  if (nodeB === null || nodeB === undefined) return false;

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
    return (
      areEquivalent(nodeA.key, nodeB.key) &&
      areEquivalent(nodeA.value, nodeB.value)
    );
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
    return areEquivalent(nodeA.body, nodeB.body);
  }

  // Call Expressions
  if (t.isCallExpression(nodeA) && t.isCallExpression(nodeB)) {
    return (
      areEquivalent(nodeA.callee, nodeB.callee) &&
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
      areEquivalent(nodeA.left, nodeB.left) &&
      areEquivalent(nodeA.right, nodeB.right)
    );
  }

  // Unary Expressions
  if (t.isUnaryExpression(nodeA) && t.isUnaryExpression(nodeB)) {
    return (
      nodeA.operator === nodeB.operator &&
      areEquivalent(nodeA.argument, nodeB.argument)
    );
  }

  // Member Expressions
  if (
    (t.isMemberExpression(nodeA) && t.isMemberExpression(nodeB)) ||
    (t.isOptionalMemberExpression(nodeA) && t.isOptionalMemberExpression(nodeB))
  ) {
    return (
      areEquivalent(nodeA.property, nodeB.property) &&
      areEquivalent(nodeA.object, nodeB.object)
    );
  }

  // New Expressions
  if (t.isNewExpression(nodeA) && t.isNewExpression(nodeB)) {
    return (
      areEquivalent(nodeA.callee, nodeB.callee) &&
      areAllEqual(nodeA.arguments, nodeB.arguments)
    );
  }

  // JSX Elements
  if (t.isJSXElement(nodeA) && t.isJSXElement(nodeB)) {
    const areClosingElementsEqual =
      (nodeA.closingElement === null && nodeB.closingElement === null) ||
      areEquivalent(nodeA.closingElement, nodeB.closingElement);

    return (
      areEquivalent(nodeA.openingElement, nodeB.openingElement) &&
      areClosingElementsEqual &&
      areAllEqual(nodeA.children, nodeB.children)
    );
  }
  if (t.isJSXOpeningElement(nodeA) && t.isJSXOpeningElement(nodeB)) {
    return (
      areEquivalent(nodeA.name, nodeB.name) &&
      areAllEqual(nodeA.attributes, nodeB.attributes)
    );
  }
  if (t.isJSXClosingElement(nodeA) && t.isJSXClosingElement(nodeB)) {
    return areEquivalent(nodeA.name, nodeB.name);
  }
  if (t.isJSXAttribute(nodeA) && t.isJSXAttribute(nodeB)) {
    return (
      areEquivalent(nodeA.name, nodeB.name) &&
      areEquivalent(nodeA.value, nodeB.value)
    );
  }
  if (t.isJSXIdentifier(nodeA) && t.isJSXIdentifier(nodeB)) {
    return nodeA.name === nodeB.name;
  }

  // TS types
  if (t.isTSTypeAnnotation(nodeA) && t.isTSTypeAnnotation(nodeB)) {
    if (
      t.isTSTypeReference(nodeA.typeAnnotation) &&
      t.isTSTypeReference(nodeB.typeAnnotation)
    ) {
      return areEquivalent(
        nodeA.typeAnnotation.typeName,
        nodeB.typeAnnotation.typeName
      );
    }

    return nodeA.typeAnnotation.type === nodeB.typeAnnotation.type;
  }

  // Return statements
  if (t.isReturnStatement(nodeA) && t.isReturnStatement(nodeB)) {
    return areEquivalent(nodeA.argument, nodeB.argument);
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
    nodesA.every((node, i) => areEquivalent(node, nodesB[i]))
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
  return path.getAncestry().some((path) => t.isIfStatement(path));
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
      areEquivalent(testA.left, testB.left) &&
      !areEquivalent(testA.right, testB.right)
    );
  }

  if (areOppositeOperators(testA.operator, testB.operator)) {
    return (
      areEquivalent(testA.left, testB.left) &&
      areEquivalent(testA.right, testB.right)
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
  return (
    t.isObjectProperty(path.node) &&
    !path.node.computed &&
    t.isIdentifier(path.node.key)
  );
}
