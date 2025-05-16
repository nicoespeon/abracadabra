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

export function getNegatedIfTest(
  test: t.ConditionalExpression["test"] | t.IfStatement["test"]
): t.ConditionalExpression["test"] | t.IfStatement["test"] {
  // Simplify double-negations
  if (t.isUnaryExpression(test)) {
    return test.argument;
  }

  // Simplify simple binary expressions
  // E.g. `a > b` => `a <= b` instead of `!(a > b)`
  if (
    t.isBinaryExpression(test) &&
    !["instanceof", "in"].includes(test.operator)
  ) {
    return {
      ...test,
      operator: getNegatedBinaryOperator(test.operator)
    };
  }

  return t.unaryExpression("!", test, true);
}
