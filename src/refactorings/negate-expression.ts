import uniqid from "uniqid";

import { Code, UpdateWith } from "./i-update-code";
import { Selection } from "./selection";
import * as ast from "./ast";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";

export { negateExpression };

async function negateExpression(
  code: Code,
  selection: Selection,
  updateWith: UpdateWith,
  showErrorMessage: ShowErrorMessage
) {
  const expressionLoc = findExpressionLoc(code, selection);

  if (!expressionLoc) {
    showErrorMessage(ErrorReason.DidNotFoundNegatableExpression);
    return;
  }

  const expressionSelection = Selection.fromAST(expressionLoc);
  await updateWith(expressionSelection, code => [
    {
      code: negate(code),
      selection: expressionSelection
    }
  ]);
}

function findExpressionLoc(
  code: Code,
  selection: Selection
): ast.SourceLocation | null {
  let result: ast.SourceLocation | null = null;

  ast.traverseAST(code, {
    enter({ node }) {
      if (!ast.isSelectableNode(node)) return;
      if (!isNegatable(node)) return;
      if (!selection.isInside(Selection.fromAST(node.loc))) return;

      result = node.loc;
    }
  });

  return result;
}

function isNegatable(node: ast.Node): boolean {
  return ast.isBinaryExpression(node) || ast.isLogicalExpression(node);
}

function negate(code: Code): Code {
  // Use ids to prevent conflicts when we replace the operators.
  const IDS = {
    looseNotEq: uniqid.time("LOOSE_NOT_EQ"),
    looseEq: uniqid.time("LOOSE_EQ"),
    strictNotEq: uniqid.time("STRICT_NOT_EQ"),
    strictEq: uniqid.time("STRICT_EQ"),
    greaterThan: uniqid.time("GREATER_THAN"),
    greaterOrEqual: uniqid.time("GREATER_OR_EQ"),
    lowerThan: uniqid.time("LOWER_THAN"),
    lowerOrEqual: uniqid.time("LOWER_OR_EQ"),
    and: uniqid.time("AND"),
    or: uniqid.time("OR")
  };

  const negatedExpression = code
    // First replace all operators with negated symbols…
    .replace(/===/g, IDS.strictNotEq)
    .replace(/!==/g, IDS.strictEq)
    .replace(/==/g, IDS.looseNotEq)
    .replace(/!=/g, IDS.looseEq)
    .replace(/>=/g, IDS.lowerThan)
    .replace(/>/g, IDS.lowerOrEqual)
    .replace(/<=/g, IDS.greaterThan)
    .replace(/</g, IDS.greaterOrEqual)
    .replace(/&&/g, IDS.or)
    .replace(/\|\|/g, IDS.and)
    // … then find all symbols to transform into the adequate operator.
    .replace(new RegExp(IDS.strictNotEq, "g"), "!==")
    .replace(new RegExp(IDS.strictEq, "g"), "===")
    .replace(new RegExp(IDS.looseNotEq, "g"), "!=")
    .replace(new RegExp(IDS.looseEq, "g"), "==")
    .replace(new RegExp(IDS.lowerThan, "g"), "<")
    .replace(new RegExp(IDS.lowerOrEqual, "g"), "<=")
    .replace(new RegExp(IDS.greaterThan, "g"), ">")
    .replace(new RegExp(IDS.greaterOrEqual, "g"), ">=")
    .replace(new RegExp(IDS.and, "g"), "&&")
    .replace(new RegExp(IDS.or, "g"), "||");

  // 🤔 Another solution could be to parse and transform the AST.
  // But this solution is simple and seems to work reasonably so far.

  const DOUBLE_NEGATION_PATTERN = /^!\(!\((.*)\)\)$/;
  return `!(${negatedExpression})`.replace(DOUBLE_NEGATION_PATTERN, "$1");
}
