import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { canNegateExpression, findNegatableExpression, negateExpression };
export { getNegatedBinaryOperator };

async function negateExpression(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const expression = findNegatableExpression(t.parse(code), selection);

  if (!expression) {
    editor.showError(ErrorReason.DidNotFoundNegatableExpression);
    return;
  }

  const expressionSelection = Selection.fromAST(expression.loc);
  await editor.readThenWrite(expressionSelection, code => [
    {
      code: negate(code),
      selection: expressionSelection
    }
  ]);
}

function canNegateExpression(
  ast: t.AST,
  selection: Selection
): {
  canNegate: boolean;
  negatedOperator: NegatableExpression["negatedOperator"];
} {
  let canNegate = false;
  let negatedOperator = null;

  t.traverseAST(ast, {
    enter({ node, parent }) {
      if (!isNegatable(node)) return;
      if (isNegatedIdentifier(node)) return;
      if (!selection.isInsideNode(node)) return;

      // If parent is unary expression we don't go further to double-negate it.
      if (t.isUnaryExpression(parent)) return;

      // E.g. `const foo = bar || "default"` => expression is not negatable
      if (t.isVariableDeclarator(parent)) return;

      // E.g. `if (!this.isValid && isCorrect)` => don't match `!this.isValid`
      if (t.isUnaryExpression(node) && t.isLogicalExpression(parent)) {
        return;
      }

      negatedOperator = t.isLogicalExpression(node)
        ? getNegatedLogicalOperator(node.operator)
        : t.isBinaryExpression(node)
        ? getNegatedBinaryOperator(node.operator)
        : null;
      canNegate = true;
    }
  });

  return { canNegate, negatedOperator };
}

function findNegatableExpression(
  ast: t.AST,
  selection: Selection
): NegatableExpression | undefined {
  let result: NegatableExpression | undefined;

  t.traverseAST(ast, {
    enter({ node, parent }) {
      if (!isNegatable(node)) return;
      if (isNegatedIdentifier(node)) return;
      if (!selection.isInsideNode(node)) return;

      // If parent is unary expression we don't go further to double-negate it.
      if (t.isUnaryExpression(parent)) return;

      // E.g. `const foo = bar || "default"` => expression is not negatable
      if (t.isVariableDeclarator(parent)) return;

      // E.g. `if (!this.isValid && isCorrect)` => don't match `!this.isValid`
      if (t.isUnaryExpression(node) && t.isLogicalExpression(parent)) {
        return;
      }

      result = {
        loc: node.loc,
        negatedOperator: t.isLogicalExpression(node)
          ? getNegatedLogicalOperator(node.operator)
          : t.isBinaryExpression(node)
          ? getNegatedBinaryOperator(node.operator)
          : null
      };
    }
  });

  return result;
}

interface NegatableExpression {
  loc: t.SourceLocation;
  negatedOperator:
    | t.BinaryExpression["operator"]
    | t.LogicalExpression["operator"]
    | null;
}

function isNegatable(
  node: t.Node
): node is t.BinaryExpression | t.LogicalExpression | t.UnaryExpression {
  return (
    (t.isUnaryExpression(node) && node.operator === "!") ||
    ((t.isBinaryExpression(node) || t.isLogicalExpression(node)) &&
      hasNegatableOperator(node.operator))
  );
}

function isNegatedIdentifier(node: t.Node): boolean {
  return t.isUnaryExpression(node) && t.isIdentifier(node.argument);
}

function hasNegatableOperator(
  operator: t.BinaryExpression["operator"] | t.LogicalExpression["operator"]
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
  const result = t.transform(code, {
    // Handle `||` and `&&` expressions
    LogicalExpression(path) {
      path.node.operator = getNegatedLogicalOperator(path.node.operator);
      path.node.left = negateBranch(path.node.left);
      path.node.right = negateBranch(path.node.right);
      const negatedExpression = t.unaryExpression("!", path.node, true);

      path.replaceWith(negatedExpression);
      path.stop();
    },

    // Handle operators like `>`, `<=`, etc.
    BinaryExpression(path) {
      path.node.operator = getNegatedBinaryOperator(path.node.operator);
      const negatedExpression = t.unaryExpression("!", path.node, true);

      path.replaceWith(negatedExpression);
      path.stop();
    }
  });

  return (
    result.code
      // Generated code has a final `;` because it's a statement.
      // E.g. `a || b` => `!(a && b);`
      .replace(/;$/, "")
      // We might end up with a double-negation, let's clean that.
      // E.g. `!(!(a || b))` => `a || b`
      .replace(/^!\(!\((.*)\)\)$/, "$1")
  );
}

function negateBranch(node: t.Expression): t.Expression {
  if (t.isUnaryExpression(node)) {
    return node.argument;
  }

  if (t.isBinaryExpression(node)) {
    return { ...node, operator: getNegatedBinaryOperator(node.operator) };
  }

  return t.unaryExpression("!", node, true);
}

function getNegatedLogicalOperator(
  operator: t.LogicalExpression["operator"]
): t.LogicalExpression["operator"] {
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
  operator: t.BinaryExpression["operator"]
): t.BinaryExpression["operator"] {
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
