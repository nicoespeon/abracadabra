import { Editor, ErrorReason } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import * as t from "../../ast";

export { convertTernaryToIfElse, createVisitor as hasTernaryToConvert };

async function convertTernaryToIfElse(editor: Editor) {
  const { code, selection } = editor;
  const updatedCode = updateCode(t.parse(code), selection);

  if (!updatedCode.hasCodeChanged) {
    editor.showError(ErrorReason.DidNotFindTernaryToConvert);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path: t.NodePath<t.ConditionalExpression>) => {
      const { parentPath, node } = path;
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
          createIfStatement(selection, node, (expression) =>
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
          createIfStatement(selection, node, (expression) =>
            createAssignment("=", id, expression)
          )
        ]);

        parentPath.parentPath.stop();
      }
    })
  );
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.ConditionalExpression>) => void
): t.Visitor {
  return {
    ConditionalExpression(path) {
      const { parentPath } = path;
      if (!selection.isInsidePath(path)) return;

      const isAssignedToVariable =
        t.isVariableDeclarator(parentPath.node) &&
        t.isVariableDeclaration(parentPath.parent);

      if (
        t.isReturnStatement(parentPath.node) ||
        t.isAssignmentExpression(parentPath.node) ||
        isAssignedToVariable
      ) {
        onMatch(path);
      }
    }
  };
}

function createIfStatement(
  selection: Selection,
  node: t.ConditionalExpression,
  createNestedStatement: CreateNestedStatement
): t.IfStatement {
  if (isSelectedConditionalExpression(node.consequent, selection)) {
    return createIfStatement(selection, node.consequent, (expression) =>
      createNestedStatement(
        t.conditionalExpression(node.test, expression, node.alternate)
      )
    );
  }

  if (isSelectedConditionalExpression(node.alternate, selection)) {
    return createIfStatement(selection, node.alternate, (expression) =>
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
