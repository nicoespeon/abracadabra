import * as t from "../../ast";
import { Code, Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";

export async function invertBooleanLogic(editor: Editor) {
  const { code, selection } = editor;
  const expression = findNegatableExpression(t.parse(code), selection);

  if (!expression) {
    editor.showError(ErrorReason.DidNotFindInvertableBooleanLogic);
    return;
  }

  const expressionSelection = Selection.fromAST(expression.loc);
  await editor.readThenWrite(expressionSelection, (code) => [
    {
      code: updateCode(code),
      selection: expressionSelection
    }
  ]);
}

function findNegatableExpression(
  ast: t.AST,
  selection: Selection
): NegatableExpression | undefined {
  let result: NegatableExpression | undefined;

  t.traverseAST(
    ast,
    createVisitor(selection, (path) => {
      result = {
        loc: path.node.loc,
        negatedOperator: getNegatedOperator(path.node)
      };

      path.stop();
    })
  );

  return result;
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.SelectablePath) => void
): t.Visitor {
  return {
    enter(path) {
      const { node, parent } = path;
      if (!isNegatable(node)) return;
      if (!wouldChangeIfNegated(node)) return;
      if (!selection.isInsideNode(node)) return;
      if (!t.isSelectablePath(path)) return;

      // If parent is unary expression we don't go further to double-negate it.
      if (t.isUnaryExpression(parent)) return;

      // E.g. `const foo = bar || "default"` => expression is not invertable
      if (t.isVariableDeclarator(parent)) return;

      // E.g. `if (!this.isValid && isCorrect)` => don't match `!this.isValid`
      if (t.isUnaryExpression(node) && t.isLogicalExpression(parent)) {
        return;
      }

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      onMatch(path);
    }
  };
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    enter(childPath) {
      const { node, parent } = childPath;
      if (!isNegatable(node)) return;
      if (!wouldChangeIfNegated(node)) return;
      if (!selection.isInsideNode(node)) return;
      if (!t.isSelectablePath(childPath)) return;

      // If parent is unary expression we don't go further to double-negate it.
      if (t.isUnaryExpression(parent)) return;

      // E.g. `const foo = bar || "default"` => expression is not invertable
      if (t.isVariableDeclarator(parent)) return;

      // E.g. `if (!this.isValid && isCorrect)` => don't match `!this.isValid`
      if (t.isUnaryExpression(node) && t.isLogicalExpression(parent)) {
        return;
      }

      result = true;
      childPath.stop();
    }
  });

  return result;
}

type NegatedOperator =
  | t.BinaryExpression["operator"]
  | t.LogicalExpression["operator"];

interface NegatableExpression {
  loc: t.SourceLocation;
  negatedOperator: NegatedOperator | null;
}

export function getNegatedOperator(node: t.Node): NegatedOperator | null {
  return t.isLogicalExpression(node)
    ? getNegatedLogicalOperator(node.operator)
    : t.isBinaryExpression(node)
      ? t.getNegatedBinaryOperator(node.operator)
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

function updateCode(code: Code): Code {
  const result = t.transform(code, {
    // Handle `||` and `&&` expressions
    LogicalExpression: negate,

    // Handle operators like `>`, `<=`, etc.
    BinaryExpression: negate
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

function negate(path: t.NodePath<t.BinaryExpression | t.LogicalExpression>) {
  const negatedExpression = t.unaryExpression(
    "!",
    negateBranch(path.node),
    true
  );

  path.replaceWith(negatedExpression);
  path.stop();
}

function negateBranch(node: t.Expression): t.Expression {
  if (t.isUnaryExpression(node)) {
    return node.argument;
  }

  if (t.isBinaryExpression(node)) {
    return { ...node, operator: t.getNegatedBinaryOperator(node.operator) };
  }

  if (t.isLogicalExpression(node)) {
    return t.logicalExpression(
      getNegatedLogicalOperator(node.operator),
      negateBranch(node.left),
      negateBranch(node.right)
    );
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
