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
  const negatedCode = ast.transform(code, setNode => ({
    UnaryExpression(path) {
      setNode(path.node.argument);
    },

    LogicalExpression(path) {
      path.node.operator = getNegatedLogicalOperator(path.node.operator);
      setNode(ast.unaryExpression("!", path.node, true));
    },

    BinaryExpression(path) {
      path.node.operator = getNegatedBinaryOperator(path.node.operator);
      setNode(ast.unaryExpression("!", path.node, true));
    }
  }));

  if (!negatedCode) {
    // TODO: show error message
    return code;
  }

  return negatedCode;
}

function getNegatedLogicalOperator(
  operator: ast.LogicalExpression["operator"]
): ast.LogicalExpression["operator"] {
  switch (operator) {
    case "||":
      return "&&";
    case "&&":
      return "||";
    default:
      return operator;
  }
}

function getNegatedBinaryOperator(
  operator: ast.BinaryExpression["operator"]
): ast.BinaryExpression["operator"] {
  switch (operator) {
    case "==":
      return "!=";
    case "!=":
      return "==";
    case "===":
      return "!==";
    case "!==":
      return "===";
    case ">":
      return "<=";
    case ">=":
      return "<";
    case "<":
      return ">=";
    case "<=":
      return ">";
    default:
      return operator;
  }
}
