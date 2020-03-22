import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { canNegateExpression, negateExpression };
export { getNegatedBinaryOperator };

async function negateExpression(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const expression = findNegatableExpression(t.parse(code), selection);

  if (!expression) {
    editor.showError(ErrorReason.DidNotFindNegatableExpression);
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
  const result = findNegatableExpression(ast, selection);
  return {
    canNegate: !!result,
    negatedOperator: (result && result.negatedOperator) || null
  };
}

function findNegatableExpression(
  ast: t.AST,
  selection: Selection
): NegatableExpression | undefined {
  let result: NegatableExpression | undefined;

  t.traverseAST(
    ast,
    createVisitor(selection, ({ node }) => {
      result = {
        loc: node.loc,
        negatedOperator: getNegatedOperator(node)
      };
    })
  );

  return result;
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<any>) => void
): t.Visitor {
  return {
    enter(path) {
      const { node, parent } = path;
      if (!isNegatable(node)) return;
      if (!wouldChangeIfNegated(node)) return;
      if (!selection.isInsideNode(node)) return;

      // If parent is unary expression we don't go further to double-negate it.
      if (t.isUnaryExpression(parent)) return;

      // E.g. `const foo = bar || "default"` => expression is not negatable
      if (t.isVariableDeclarator(parent)) return;

      // E.g. `if (!this.isValid && isCorrect)` => don't match `!this.isValid`
      if (t.isUnaryExpression(node) && t.isLogicalExpression(parent)) {
        return;
      }

      onMatch(path);
    }
  };
}

type NegatedOperator =
  | t.BinaryExpression["operator"]
  | t.LogicalExpression["operator"]
  | null;

interface NegatableExpression {
  loc: t.SourceLocation;
  negatedOperator: NegatedOperator;
}

function getNegatedOperator(node: t.Node): NegatedOperator {
  return t.isLogicalExpression(node)
    ? getNegatedLogicalOperator(node.operator)
    : t.isBinaryExpression(node)
    ? getNegatedBinaryOperator(node.operator)
    : null;
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

function wouldChangeIfNegated(node: t.Node): boolean {
  return !(
    t.isUnaryExpression(node) &&
    (t.isIdentifier(node.argument) || t.isCallExpression(node.argument))
  );
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
      .replace(/^!\(\s*!\((.*)\)\s*\)$/, "$1")
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
