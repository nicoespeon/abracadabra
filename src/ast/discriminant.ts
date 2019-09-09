import * as t from "@babel/types";

export { getDiscriminantFrom };

function getDiscriminantFrom(expression: t.Expression): t.Expression | null {
  if (t.isBinaryExpression(expression)) {
    return t.isIdentifier(expression.left) ? expression.left : expression.right;
  }

  return null;
}
