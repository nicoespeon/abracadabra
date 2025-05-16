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
