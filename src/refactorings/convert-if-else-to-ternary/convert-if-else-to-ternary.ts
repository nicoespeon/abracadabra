import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as ast from "../../ast";

export { convertIfElseToTernary, hasIfElseToConvert };

async function convertIfElseToTernary(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundIfElseToConvert);
    return;
  }

  await editor.write(updatedCode.code);
}

function hasIfElseToConvert(code: Code, selection: Selection): boolean {
  return updateCode(code, selection).hasCodeChanged;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    IfStatement(path) {
      const { node } = path;
      if (!selection.isInsidePath(path)) return;

      const ternary =
        getReturnStatementTernary(node) || getAssignmentExpressionTernary(node);
      if (!ternary) return;

      path.replaceWith(ternary);
      path.stop();
    }
  });
}

function getReturnStatementTernary(
  node: ast.IfStatement
): ast.ReturnStatement | undefined {
  const ifReturnedStatement = getReturnedStatement(node.consequent);
  if (!ifReturnedStatement) return;
  if (!ifReturnedStatement.argument) return;

  const elseReturnedStatement = getReturnedStatement(node.alternate);
  if (!elseReturnedStatement) return;
  if (!elseReturnedStatement.argument) return;

  let result = ast.returnStatement(
    ast.conditionalExpression(
      node.test,
      ifReturnedStatement.argument,
      elseReturnedStatement.argument
    )
  );

  result = ast.mergeCommentsInto(result, [
    ifReturnedStatement,
    elseReturnedStatement
  ]);

  return result;
}

function getReturnedStatement(
  node: ast.Statement | null
): ast.ReturnStatement | null {
  if (!ast.isBlockStatement(node)) return null;

  const firstChild = node.body[0];
  if (!ast.isReturnStatement(firstChild)) return null;

  return firstChild;
}

function getAssignmentExpressionTernary(
  node: ast.IfStatement
): ast.AssignmentExpression | undefined {
  const ifAssignedStatement = getAssignedStatement(node.consequent);
  if (!ifAssignedStatement) return;

  const elseAssignedStatement = getAssignedStatement(node.alternate);
  if (!elseAssignedStatement) return;

  const ifAssignment = ifAssignedStatement.expression;
  const elseAssignment = elseAssignedStatement.expression;

  if (!areSameAssignments(ifAssignment, elseAssignment)) {
    return;
  }

  let result = ast.assignmentExpression(
    ifAssignment.operator,
    ifAssignment.left,
    ast.conditionalExpression(
      node.test,
      ifAssignment.right,
      elseAssignment.right
    )
  );

  result = ast.mergeCommentsInto(result, [
    ifAssignedStatement,
    elseAssignedStatement
  ]);

  return result;
}

function getAssignedStatement(
  node: ast.Statement | null
): ast.ExpressionStatement & { expression: ast.AssignmentExpression } | null {
  if (!ast.isBlockStatement(node)) return null;
  if (node.body.length > 1) return null;

  const firstChild = node.body[0];
  if (!ast.isExpressionStatement(firstChild)) return null;

  const expression = firstChild.expression;
  if (!ast.isAssignmentExpression(expression)) return null;

  return { ...firstChild, expression };
}

function areSameAssignments(
  expressionA: ast.AssignmentExpression,
  expressionB: ast.AssignmentExpression
): boolean {
  return (
    haveSameLeftIdentifiers(expressionA, expressionB) &&
    expressionA.operator === expressionB.operator
  );
}

function haveSameLeftIdentifiers(
  expressionA: ast.AssignmentExpression,
  expressionB: ast.AssignmentExpression
): boolean {
  return (
    ast.isIdentifier(expressionA.left) &&
    ast.isIdentifier(expressionB.left) &&
    expressionA.left.name === expressionB.left.name
  );
}
