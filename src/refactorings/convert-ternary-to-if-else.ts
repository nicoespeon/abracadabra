import { Code, Write } from "./editor/i-write-code";
import { Selection } from "./editor/selection";
import { ShowErrorMessage, ErrorReason } from "./editor/i-show-error-message";
import * as ast from "./ast";

export { convertTernaryToIfElse, hasTernaryToConvert };

async function convertTernaryToIfElse(
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) {
  const updatedCode = updateCode(code, selection);

  if (!updatedCode.hasSelectedNode || !updatedCode.loc) {
    showErrorMessage(ErrorReason.DidNotFoundTernaryToConvert);
    return;
  }

  await write([
    {
      code: updatedCode.code,
      selection: Selection.fromAST(updatedCode.loc)
    }
  ]);
}

function hasTernaryToConvert(code: Code, selection: Selection): boolean {
  return updateCode(code, selection).hasSelectedNode;
}

function updateCode(code: Code, selection: Selection): ast.Transformed {
  return ast.transform(code, selectNode => ({
    ConditionalExpression(path) {
      const { parentPath, node } = path;
      if (!ast.isSelectableNode(node)) return;
      if (!selection.isInside(Selection.fromAST(node.loc))) return;

      if (ast.isReturnStatement(parentPath.node)) {
        parentPath.replaceWith(createReturnIfStatement(selection, node));
        selectNode(parentPath.parent);
      }

      if (ast.isAssignmentExpression(parentPath.node)) {
        parentPath.parentPath.replaceWith(
          createIfStatement(
            node.test,
            createAssignment(
              parentPath.node.operator,
              parentPath.node.left,
              node.consequent
            ),
            createAssignment(
              parentPath.node.operator,
              parentPath.node.left,
              node.alternate
            )
          )
        );

        selectNode(parentPath.parentPath.parent);
      }

      if (
        ast.isVariableDeclarator(parentPath.node) &&
        ast.isVariableDeclaration(parentPath.parent)
      ) {
        parentPath.parentPath.replaceWithMultiple([
          createLetDeclaration(parentPath.node.id),
          createIfStatement(
            node.test,
            createValueAssignment(parentPath.node.id, node.consequent),
            createValueAssignment(parentPath.node.id, node.alternate)
          )
        ]);

        selectNode(parentPath.parentPath.parent);
      }
    }
  }));
}

function createReturnIfStatement(
  selection: Selection,
  node: ast.ConditionalExpression,
  createNestedExpression: CreateNestedExpression = id => id
): ast.IfStatement {
  if (isSelectedConditionalExpression(node.consequent, selection)) {
    return createReturnIfStatement(selection, node.consequent, expression =>
      createNestedExpression(
        ast.conditionalExpression(node.test, expression, node.alternate)
      )
    );
  }

  if (isSelectedConditionalExpression(node.alternate, selection)) {
    return createReturnIfStatement(selection, node.alternate, expression =>
      createNestedExpression(
        ast.conditionalExpression(node.test, node.consequent, expression)
      )
    );
  }

  return createIfStatement(
    node.test,
    ast.returnStatement(createNestedExpression(node.consequent)),
    ast.returnStatement(createNestedExpression(node.alternate))
  );
}

type CreateNestedExpression = (expression: ast.Expression) => ast.Expression;

function isSelectedConditionalExpression(
  node: ast.Node,
  selection: Selection
): node is ast.ConditionalExpression {
  return (
    ast.isConditionalExpression(node) &&
    ast.isSelectableNode(node) &&
    selection.isInside(Selection.fromAST(node.loc))
  );
}

function createIfStatement(
  test: ast.Expression,
  consequent: ast.Statement,
  alternate: ast.Statement
): ast.IfStatement {
  return ast.ifStatement(
    test,
    ast.blockStatement([consequent]),
    ast.blockStatement([alternate])
  );
}

function createLetDeclaration(id: ast.LVal): ast.VariableDeclaration {
  return ast.variableDeclaration("let", [ast.variableDeclarator(id)]);
}

function createValueAssignment(
  id: ast.LVal,
  value: ast.Expression
): ast.ExpressionStatement {
  return createAssignment("=", id, value);
}

function createAssignment(
  operator: string,
  id: ast.LVal,
  value: ast.Expression
): ast.ExpressionStatement {
  return ast.expressionStatement(ast.assignmentExpression(operator, id, value));
}
