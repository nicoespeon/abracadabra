import * as t from "@babel/types";
import { match } from "ts-pattern";

export function getNegatedBinaryOperator(
  operator: t.BinaryExpression["operator"]
): t.BinaryExpression["operator"] {
  return match(operator)
    .with("==", () => "!=" as const)
    .with("!=", () => "==" as const)
    .with("===", () => "!==" as const)
    .with("!==", () => "===" as const)
    .with(">", () => "<=" as const)
    .with(">=", () => "<" as const)
    .with("<", () => ">=" as const)
    .with("<=", () => ">" as const)
    .otherwise(() => operator);
}

export function getNegatedLogicalOperator(
  operator: t.LogicalExpression["operator"]
): t.LogicalExpression["operator"] {
  return match(operator)
    .with("||", () => "&&" as const)
    .with("&&", () => "||" as const)
    .otherwise(() => operator);
}

export function getNegatedExpression(
  node: t.Expression,
  options: {
    /** If `true`, nested logical expressions will be negated too. */
    transformLogicalExpression?: boolean;
  } = {}
): t.Expression {
  const { transformLogicalExpression = false } = options;

  // Simplify double-negations
  if (t.isUnaryExpression(node)) {
    return node.argument;
  }

  // Simplify simple binary expressions
  // E.g. `a > b` => `a <= b` instead of `!(a > b)`
  if (
    t.isBinaryExpression(node) &&
    !["instanceof", "in"].includes(node.operator)
  ) {
    return {
      ...node,
      operator: getNegatedBinaryOperator(node.operator)
    };
  }

  if (transformLogicalExpression && t.isLogicalExpression(node)) {
    return t.logicalExpression(
      getNegatedLogicalOperator(node.operator),
      getNegatedExpression(node.left, options),
      getNegatedExpression(node.right, options)
    );
  }

  return t.unaryExpression("!", node, true);
}
