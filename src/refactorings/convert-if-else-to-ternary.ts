import { Code, Write } from "./editor/i-write-code";
import { Selection } from "./editor/selection";
import { ShowErrorMessage, ErrorReason } from "./editor/i-show-error-message";
import * as ast from "./ast";

export { convertIfElseToTernary, hasIfElseToConvert };

async function convertIfElseToTernary(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasCodeChanged) {
    showErrorMessage(ErrorReason.DidNotFoundIfElseToConvert);
    return;
  }

  await write(updatedCode.code);
}

function hasIfElseToConvert(code: Code, selection: Selection): boolean {
  return updateCode(code, selection).hasCodeChanged;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, {
    IfStatement(path) {
      const { node } = path;
      if (!ast.isSelectableNode(node)) return;
      if (!selection.isInside(Selection.fromAST(node.loc))) return;

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
  const ifReturnedArgument = getReturnedArgument(node.consequent);
  if (!ifReturnedArgument) return;

  const elseReturnedArgument = getReturnedArgument(node.alternate);
  if (!elseReturnedArgument) return;

  return ast.returnStatement(
    ast.conditionalExpression(
      node.test,
      ifReturnedArgument,
      elseReturnedArgument
    )
  );
}

function getReturnedArgument(
  node: ast.Statement | null
): ast.ReturnStatement["argument"] {
  if (!ast.isBlockStatement(node)) return null;

  const firstChild = node.body[0];
  if (!ast.isReturnStatement(firstChild)) return null;

  return firstChild.argument;
}

function getAssignmentExpressionTernary(
  node: ast.IfStatement
): ast.AssignmentExpression | undefined {
  const ifAssignedArgument = getAssignedArgument(node.consequent);
  if (!ifAssignedArgument) return;

  const elseAssignedArgument = getAssignedArgument(node.alternate);
  if (!elseAssignedArgument) return;

  if (!areSameAssignments(ifAssignedArgument, elseAssignedArgument)) {
    return;
  }

  return ast.assignmentExpression(
    ifAssignedArgument.operator,
    ifAssignedArgument.left,
    ast.conditionalExpression(
      node.test,
      ifAssignedArgument.right,
      elseAssignedArgument.right
    )
  );
}

function getAssignedArgument(
  node: ast.Statement | null
): ast.AssignmentExpression | null {
  if (!ast.isBlockStatement(node)) return null;
  if (node.body.length > 1) return null;

  const firstChild = node.body[0];
  if (!ast.isExpressionStatement(firstChild)) return null;
  if (!ast.isAssignmentExpression(firstChild.expression)) return null;

  return firstChild.expression;
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
