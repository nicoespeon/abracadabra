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
        parentPath.replaceWith(
          createIfStatement(selection, node, ast.returnStatement)
        );

        selectNode(parentPath.parent);
        parentPath.stop();
      }

      if (ast.isAssignmentExpression(parentPath.node)) {
        const { operator, left } = parentPath.node;

        // AssignmentExpression is contained in an ExpressionStatement
        // => replace parentPath's parent path
        parentPath.parentPath.replaceWith(
          createIfStatement(selection, node, expression =>
            createAssignment(operator, left, expression)
          )
        );

        selectNode(parentPath.parentPath.parent);
        parentPath.parentPath.stop();
      }

      if (
        ast.isVariableDeclarator(parentPath.node) &&
        ast.isVariableDeclaration(parentPath.parent)
      ) {
        const id = parentPath.node.id;

        // VariableDeclarator is contained in a VariableDeclaration
        // => replace parentPath's parent path
        parentPath.parentPath.replaceWithMultiple([
          createLetDeclaration(id),
          createIfStatement(selection, node, expression =>
            createAssignment("=", id, expression)
          )
        ]);

        selectNode(parentPath.parentPath.parent);
        parentPath.parentPath.stop();
      }
    }
  }));
}

function createIfStatement(
  selection: Selection,
  node: ast.ConditionalExpression,
  createNestedStatement: CreateNestedStatement
): ast.IfStatement {
  if (isSelectedConditionalExpression(node.consequent, selection)) {
    return createIfStatement(selection, node.consequent, expression =>
      createNestedStatement(
        ast.conditionalExpression(node.test, expression, node.alternate)
      )
    );
  }

  if (isSelectedConditionalExpression(node.alternate, selection)) {
    return createIfStatement(selection, node.alternate, expression =>
      createNestedStatement(
        ast.conditionalExpression(node.test, node.consequent, expression)
      )
    );
  }

  return ast.ifStatement(
    node.test,
    ast.blockStatement([createNestedStatement(node.consequent)]),
    ast.blockStatement([createNestedStatement(node.alternate)])
  );
}

type CreateNestedStatement = (expression: ast.Expression) => ast.Statement;

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

function createLetDeclaration(id: ast.LVal): ast.VariableDeclaration {
  return ast.variableDeclaration("let", [ast.variableDeclarator(id)]);
}

function createAssignment(
  operator: string,
  id: ast.LVal,
  value: ast.Expression
): ast.ExpressionStatement {
  return ast.expressionStatement(ast.assignmentExpression(operator, id, value));
}
