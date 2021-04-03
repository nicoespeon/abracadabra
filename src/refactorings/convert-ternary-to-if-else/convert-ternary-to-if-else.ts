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

  if (updatedCode.otherVariablesDeclared) {
    editor.showError(ErrorReason.CantConvertTernaryWithOtherDeclarations);
    return;
  }

  await editor.write(updatedCode.code);
}

function updateCode(
  ast: t.AST,
  selection: Selection
): t.Transformed & { otherVariablesDeclared: boolean } {
  let otherVariablesDeclared = false;

  const result = t.transformAST(
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

      if (isAssignedToVariable(path)) {
        const { parentPath } = path;
        const id = parentPath.node.id;

        const otherDeclarations = [
          ...parentPath.getAllNextSiblings(),
          ...parentPath.getAllPrevSiblings()
        ];
        otherVariablesDeclared = otherDeclarations.length > 0;

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

  return { ...result, otherVariablesDeclared };
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.ConditionalExpression>) => void
): t.Visitor {
  return {
    ConditionalExpression(path) {
      const { parentPath } = path;

      if (isAssignedToVariable(path)) {
        // Enlarge selection to the whole variable declaration
        if (!selection.isInsidePath(path.parentPath.parentPath)) return;
      } else {
        if (!selection.isInsidePath(path)) return;
      }

      if (
        t.isReturnStatement(parentPath.node) ||
        t.isAssignmentExpression(parentPath.node) ||
        isAssignedToVariable(path)
      ) {
        onMatch(path);
      }
    }
  };
}

function isAssignedToVariable(
  path: t.NodePath<t.Node>
): path is t.NodePath & { parentPath: t.NodePath<t.VariableDeclarator> } {
  return (
    t.isVariableDeclarator(path.parent) &&
    t.isVariableDeclaration(path.parentPath.parent)
  );
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
