import uniqid from "uniqid";

import { Code, UpdateWith } from "./i-update-code";
import { Selection } from "./selection";
import * as ast from "./ast";
// import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";

export { negateExpression };

async function negateExpression(
  code: Code,
  selection: Selection,
  updateWith: UpdateWith
) {
  const expressionLoc = findExpressionLoc(code, selection);

  if (!expressionLoc) {
    // TODO: show error message
    return;
  }

  const expressionSelection = Selection.fromAST(expressionLoc);
  await updateWith(expressionSelection, code => [
    {
      code: `!(${negate(code)})`,
      selection: expressionSelection
    }
  ]);
}

function findExpressionLoc(
  code: Code,
  // TODO: test with many binary expressions
  _selection: Selection
): ast.SourceLocation | null {
  let result: ast.SourceLocation | null = null;

  ast.traverseAST(code, {
    enter({ node }) {
      if (!ast.isSelectableNode(node)) return;
      if (!ast.isBinaryExpression(node)) return;

      result = node.loc;
    }
  });

  return result;
}

function negate(code: Code): Code {
  const OPERATORS = {
    looseNotEq: "!=",
    looseEq: "==",
    strictNotEq: "!==",
    strictEq: "===",
    greaterThan: ">",
    greaterOrEqual: ">=",
    lowerThan: "<",
    lowerOrEqual: "<="
  };

  // Use symbols to prevent conflicts when we replace the operators.
  // Symbols should be unique, so we can identify them in code.
  const SYMBOLS = {
    looseNotEq: uniqid.time("LOOSE_NOT_EQ"),
    looseEq: uniqid.time("LOOSE_EQ"),
    strictNotEq: uniqid.time("STRICT_NOT_EQ"),
    strictEq: uniqid.time("STRICT_EQ"),
    greaterThan: uniqid.time("GREATER_THAN"),
    greaterOrEqual: uniqid.time("GREATER_OR_EQ"),
    lowerThan: uniqid.time("LOWER_THAN"),
    lowerOrEqual: uniqid.time("LOWER_OR_EQ")
  };

  return (
    code
      // First replace all operators with negated symbols…
      .replace(OPERATORS.strictEq, SYMBOLS.strictNotEq)
      .replace(OPERATORS.strictNotEq, SYMBOLS.strictEq)
      .replace(OPERATORS.looseEq, SYMBOLS.looseNotEq)
      .replace(OPERATORS.looseNotEq, SYMBOLS.looseEq)
      .replace(OPERATORS.greaterOrEqual, SYMBOLS.lowerThan)
      .replace(OPERATORS.greaterThan, SYMBOLS.lowerOrEqual)
      .replace(OPERATORS.lowerOrEqual, SYMBOLS.greaterThan)
      .replace(OPERATORS.lowerThan, SYMBOLS.greaterOrEqual)
      // … then find all symbols to transform into the adequate operator.
      .replace(SYMBOLS.strictNotEq, OPERATORS.strictNotEq)
      .replace(SYMBOLS.strictEq, OPERATORS.strictEq)
      .replace(SYMBOLS.looseNotEq, OPERATORS.looseNotEq)
      .replace(SYMBOLS.looseEq, OPERATORS.looseEq)
      .replace(SYMBOLS.lowerThan, OPERATORS.lowerThan)
      .replace(SYMBOLS.lowerOrEqual, OPERATORS.lowerOrEqual)
      .replace(SYMBOLS.greaterThan, OPERATORS.greaterThan)
      .replace(SYMBOLS.greaterOrEqual, OPERATORS.greaterOrEqual)
  );

  // 🤔 Another solution could be to parse and transform the AST.
  // But this solution is simple and seems to work reasonably so far.
}
