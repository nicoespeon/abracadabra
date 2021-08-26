import * as t from "@babel/types";

export { toSwitch, VALID_OPERATORS };

const VALID_OPERATORS: t.BinaryExpression["operator"][] = ["==", "==="];

function toSwitch(expression: t.Expression): Switch | null {
  if (!t.isBinaryExpression(expression)) return null;
  if (!VALID_OPERATORS.includes(expression.operator)) return null;

  const { left, right } = expression;
  if (t.isPrivateName(left)) return null;

  return t.isIdentifier(left) || t.isMemberExpression(left)
    ? { discriminant: left, test: right }
    : { discriminant: right, test: left };
}

interface Switch {
  discriminant: t.SwitchStatement["discriminant"];
  test: t.SwitchCase["test"];
}
