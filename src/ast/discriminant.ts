import * as t from "@babel/types";

export { getDiscriminantFrom, VALID_OPERATORS };

const VALID_OPERATORS: t.BinaryExpression["operator"][] = ["==", "==="];

function getDiscriminantFrom(expression: t.Expression): t.Expression | null {
  if (!t.isBinaryExpression(expression)) return null;
  if (!VALID_OPERATORS.includes(expression.operator)) return null;

  return t.isIdentifier(expression.left) ? expression.left : expression.right;
}
