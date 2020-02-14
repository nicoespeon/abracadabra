import { Editor, Code, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { convertTernaryToIfElse, hasTernaryToConvertVisitorFactory };

async function convertTernaryToIfElse(
  code: Code,
  selection: Selection,
  editor: Editor
) {
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFoundTernaryToConvert);
    return;
  }

  await editor.write(updatedCode.code);
}

function hasTernaryToConvertVisitorFactory(
  selection: Selection,
  onMatch: (path: t.NodePath<any>) => void
): t.Visitor {
  return {
    ConditionalExpression(path) {
      const { parentPath } = path;
      if (!selection.isInsidePath(path)) return;

      if (t.isReturnStatement(parentPath.node)) {
        onMatch(path);
      }

      if (t.isAssignmentExpression(parentPath.node)) {
        onMatch(path);
      }

      if (
        t.isVariableDeclarator(parentPath.node) &&
        t.isVariableDeclaration(parentPath.parent)
      ) {
        onMatch(path);
      }
    }
  };
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(ast, {
    ConditionalExpression(path) {
      const { parentPath, node } = path;
      if (!selection.isInsidePath(path)) return;

      if (t.isReturnStatement(parentPath.node)) {
        parentPath.replaceWith(
          createIfStatement(selection, node, t.returnStatement)
        );

        parentPath.stop();
      }

      if (t.isAssignmentExpression(parentPath.node)) {
        const { operator, left } = parentPath.node;

        // AssignmentExpression is contained in an ExpressionStatement
        // => replace parentPath's parent path
        parentPath.parentPath.replaceWith(
          createIfStatement(selection, node, expression =>
            createAssignment(operator, left, expression)
          )
        );

        parentPath.parentPath.stop();
      }

      if (
        t.isVariableDeclarator(parentPath.node) &&
        t.isVariableDeclaration(parentPath.parent)
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

        parentPath.parentPath.stop();
      }
    }
  });
}

function createIfStatement(
  selection: Selection,
  node: t.ConditionalExpression,
  createNestedStatement: CreateNestedStatement
): t.IfStatement {
  if (isSelectedConditionalExpression(node.consequent, selection)) {
    return createIfStatement(selection, node.consequent, expression =>
      createNestedStatement(
        t.conditionalExpression(node.test, expression, node.alternate)
      )
    );
  }

  if (isSelectedConditionalExpression(node.alternate, selection)) {
    return createIfStatement(selection, node.alternate, expression =>
      createNestedStatement(
        t.conditionalExpression(node.test, node.consequent, expression)
      )
    );
  }

  return t.ifStatement(
    node.test,
    t.blockStatement([createNestedStatement(node.consequent)]),
    t.blockStatement([createNestedStatement(node.alternate)])
  );
}

type CreateNestedStatement = (expression: t.Expression) => t.Statement;

function isSelectedConditionalExpression(
  node: t.Node,
  selection: Selection
): node is t.ConditionalExpression {
  return t.isConditionalExpression(node) && selection.isInsideNode(node);
}

function createLetDeclaration(id: t.LVal): t.VariableDeclaration {
  return t.variableDeclaration("let", [t.variableDeclarator(id)]);
}

function createAssignment(
  operator: string,
  id: t.LVal,
  value: t.Expression
): t.ExpressionStatement {
  return t.expressionStatement(t.assignmentExpression(operator, id, value));
}
