import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { convertIfElseToTernary, hasIfElseToConvert };

async function convertIfElseToTernary(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundIfElseToConvert);
    return;
  }

  await editor.write(updatedCode.code);
}

function hasIfElseToConvert(ast: t.AST, selection: Selection): boolean {
  let result = false;

  t.traverseAST(ast, {
    IfStatement(path) {
      const { node } = path;
      if (!selection.isInsidePath(path)) return;

      const ternary =
        getReturnStatementTernary(path) || getAssignmentExpressionTernary(node);
      if (!ternary) return;

      result = true;
    }
  });

  return result;
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(ast, {
    IfStatement(path) {
      const { node } = path;
      if (!selection.isInsidePath(path)) return;

      const ternary =
        getReturnStatementTernary(path) || getAssignmentExpressionTernary(node);
      if (!ternary) return;

      path.replaceWith(ternary);
      path.stop();
    }
  });
}

function getReturnStatementTernary(
  path: t.NodePath<t.IfStatement>
): t.ReturnStatement | undefined {
  const { node } = path;

  const ifReturnedStatement = getReturnedStatement(node.consequent);
  if (!ifReturnedStatement) return;
  if (!ifReturnedStatement.argument) return;

  const elseReturnedStatement = getReturnedStatement(node.alternate);
  if (!elseReturnedStatement) return;
  if (!elseReturnedStatement.argument) return;

  let result = t.returnStatement(
    t.conditionalExpression(
      node.test,
      ifReturnedStatement.argument,
      elseReturnedStatement.argument
    )
  );

  result = t.mergeCommentsInto(result, [
    ifReturnedStatement,
    elseReturnedStatement
  ]);

  return result;
}

function getReturnedStatement(
  node: t.Statement | null
): t.ReturnStatement | null {
  if (!t.isBlockStatement(node)) return null;

  const firstChild = node.body[0];
  if (!t.isReturnStatement(firstChild)) return null;

  return firstChild;
}

function getAssignmentExpressionTernary(
  node: t.IfStatement
): t.AssignmentExpression | undefined {
  const ifAssignedStatement = getAssignedStatement(node.consequent);
  if (!ifAssignedStatement) return;

  const elseAssignedStatement = getAssignedStatement(node.alternate);
  if (!elseAssignedStatement) return;

  const ifAssignment = ifAssignedStatement.expression;
  const elseAssignment = elseAssignedStatement.expression;

  if (!areSameAssignments(ifAssignment, elseAssignment)) {
    return;
  }

  let result = t.assignmentExpression(
    ifAssignment.operator,
    ifAssignment.left,
    t.conditionalExpression(node.test, ifAssignment.right, elseAssignment.right)
  );

  result = t.mergeCommentsInto(result, [
    ifAssignedStatement,
    elseAssignedStatement
  ]);

  return result;
}

function getAssignedStatement(
  node: t.Statement | null
): t.ExpressionStatement & { expression: t.AssignmentExpression } | null {
  if (!t.isBlockStatement(node)) return null;
  if (node.body.length > 1) return null;

  const firstChild = node.body[0];
  if (!t.isExpressionStatement(firstChild)) return null;

  const expression = firstChild.expression;
  if (!t.isAssignmentExpression(expression)) return null;

  return { ...firstChild, expression };
}

function areSameAssignments(
  expressionA: t.AssignmentExpression,
  expressionB: t.AssignmentExpression
): boolean {
  return (
    haveSameLeftIdentifiers(expressionA, expressionB) &&
    expressionA.operator === expressionB.operator
  );
}

function haveSameLeftIdentifiers(
  expressionA: t.AssignmentExpression,
  expressionB: t.AssignmentExpression
): boolean {
  return (
    t.isIdentifier(expressionA.left) &&
    t.isIdentifier(expressionB.left) &&
    expressionA.left.name === expressionB.left.name
  );
}
