import { Code, UpdateWith } from "./i-update-code";
import { Selection } from "./selection";
import * as ast from "./ast";
import { ShowErrorMessage, ErrorReason } from "./i-show-error-message";

export { canBeNegated, negateExpression };

function canBeNegated(code: Code, selection: Selection): boolean {
  return !!findExpressionLoc(code, selection);
}

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
  await updateWith(expressionSelection, code => {
    const negatedCode = negate(code);

    if (!negatedCode) {
      showErrorMessage(ErrorReason.DidNotFoundNegatableExpression);
      return [];
    }

    return [
      {
        code: negatedCode,
        selection: expressionSelection
      }
    ];
  });
}

function findExpressionLoc(
  code: Code,
  selection: Selection
): ast.SourceLocation | null {
  let result: ast.SourceLocation | null = null;

  ast.traverseAST(code, {
    enter({ node, parent }) {
      if (!ast.isSelectableNode(node)) return;
      if (!isNegatable(node)) return;
      if (!selection.isInside(Selection.fromAST(node.loc))) return;

      // If parent is unary expression we don't go further to double-negate it.
      if (ast.isUnaryExpression(parent)) return;

      result = node.loc;
    }
  });

  return result;
}

function isNegatable(node: ast.Node): boolean {
  return (
    ast.isBinaryExpression(node) ||
    ast.isLogicalExpression(node) ||
    ast.isUnaryExpression(node)
  );
}

function negate(code: Code): Code | undefined {
  return ast.transform(code, setNode => ({
    UnaryExpression(path) {
      setNode(path.node.argument);
    },

    LogicalExpression(path) {
      path.node.operator = getNegatedLogicalOperator(path.node.operator);

      if (ast.isIdentifier(path.node.left)) {
        path.node.left = ast.unaryExpression("!", path.node.left, true);
      }

      if (ast.isIdentifier(path.node.right)) {
        path.node.right = ast.unaryExpression("!", path.node.right, true);
      }

      setNode(ast.unaryExpression("!", path.node, true));
    },

    BinaryExpression(path) {
      path.node.operator = getNegatedBinaryOperator(path.node.operator);
      setNode(ast.unaryExpression("!", path.node, true));
    }
  }));
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
