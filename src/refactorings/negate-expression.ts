import { Code, ReadThenWrite } from "./editor/i-write-code";
import { Selection } from "./editor/selection";
import { ShowErrorMessage, ErrorReason } from "./editor/i-show-error-message";
import * as ast from "./ast";

export { findNegatableExpression, negateExpression };
export { getNegatedBinaryOperator };

async function negateExpression(
  code: Code,
  selection: Selection,
  readThenWrite: ReadThenWrite,
  showErrorMessage: ShowErrorMessage
) {
  const expression = findNegatableExpression(code, selection);

  if (!expression) {
    showErrorMessage(ErrorReason.DidNotFoundNegatableExpression);
    return;
  }

  const expressionSelection = Selection.fromAST(expression.loc);
  await readThenWrite(expressionSelection, code => [
    {
      code: negate(code),
      selection: expressionSelection
    }
  ]);
}

function findNegatableExpression(
  code: Code,
  selection: Selection
): NegatableExpression | undefined {
  let result: NegatableExpression | undefined;

  ast.traverseAST(code, {
    enter({ node, parent }) {
      if (!ast.isSelectableNode(node)) return;
      if (!isNegatable(node)) return;
      if (isNegatedIdentifier(node)) return;
      if (!selection.isInside(Selection.fromAST(node.loc))) return;

      // If parent is unary expression we don't go further to double-negate it.
      if (ast.isUnaryExpression(parent)) return;

      // E.g. `const foo = bar || "default"` => expression is not negatable
      if (ast.isVariableDeclarator(parent)) return;

      // E.g. `if (!this.isValid && isCorrect)` => don't match `!this.isValid`
      if (ast.isUnaryExpression(node) && ast.isLogicalExpression(parent)) {
        return;
      }

      result = {
        loc: node.loc,
        negatedOperator: ast.isLogicalExpression(node)
          ? getNegatedLogicalOperator(node.operator)
          : ast.isBinaryExpression(node)
          ? getNegatedBinaryOperator(node.operator)
          : null
      };
    }
  });

  return result;
}

interface NegatableExpression {
  loc: ast.SourceLocation;
  negatedOperator:
    | ast.BinaryExpression["operator"]
    | ast.LogicalExpression["operator"]
    | null;
}

function isNegatable(
  node: ast.Node
): node is ast.BinaryExpression | ast.LogicalExpression | ast.UnaryExpression {
  return (
    (ast.isUnaryExpression(node) && node.operator === "!") ||
    ((ast.isBinaryExpression(node) || ast.isLogicalExpression(node)) &&
      hasNegatableOperator(node.operator))
  );
}

function isNegatedIdentifier(node: ast.Node): boolean {
  return ast.isUnaryExpression(node) && ast.isIdentifier(node.argument);
}

function hasNegatableOperator(
  operator: ast.BinaryExpression["operator"] | ast.LogicalExpression["operator"]
): boolean {
  const NEGATABLE_OPERATORS = [
    "==",
    "!=",
    "===",
    "!==",
    ">",
    ">=",
    "<",
    "<=",
    "||",
    "&&"
  ];

  return NEGATABLE_OPERATORS.includes(operator);
}

function negate(code: Code): Code {
  const result = ast.transform(code, () => ({
    // Handle `||` and `&&` expressions
    LogicalExpression(path) {
      path.node.operator = getNegatedLogicalOperator(path.node.operator);
      path.node.left = negateBranch(path.node.left);
      path.node.right = negateBranch(path.node.right);
      const negatedExpression = ast.unaryExpression("!", path.node, true);

      path.replaceWith(negatedExpression);
      path.stop();
    },

    // Handle operators like `>`, `<=`, etc.
    BinaryExpression(path) {
      path.node.operator = getNegatedBinaryOperator(path.node.operator);
      const negatedExpression = ast.unaryExpression("!", path.node, true);

      path.replaceWith(negatedExpression);
      path.stop();
    }
  }));

  return (
    result.code
      // Generated code has a final `;` because it's a statement.
      // E.g. `a || b` => `!(a && b);`
      .replace(/;$/, "")
      // We might end up with a double-negation, let's clean that.
      // E.g. `!!(a || b)` => `a || b`
      .replace(/^!!\((.*)\)$/, "$1")
  );
}

function negateBranch(node: ast.Expression): ast.Expression {
  if (ast.isUnaryExpression(node)) {
    return node.argument;
  }

  if (ast.isBinaryExpression(node)) {
    return { ...node, operator: getNegatedBinaryOperator(node.operator) };
  }

  return ast.unaryExpression("!", node, true);
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
