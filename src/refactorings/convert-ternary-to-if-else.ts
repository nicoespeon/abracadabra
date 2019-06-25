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
      const { node, parentPath, parent } = path;
      if (!ast.isSelectableNode(node)) return;
      if (!selection.isInside(Selection.fromAST(node.loc))) return;

      // Scenario `return isVIP ? "vip" : "normal"`
      if (ast.isReturnStatement(parent)) {
        parentPath.replaceWith(
          createIfStatement(
            node.test,
            ast.returnStatement(node.consequent),
            ast.returnStatement(node.alternate)
          )
        );

        path.stop();
        selectNode(parentPath.parent);
        return;
      }

      // Scenario `mode = isVIP ? "vip" : "normal"`
      if (ast.isAssignmentExpression(parent)) {
        const operator = parent.operator;
        const id = parent.left;

        parentPath.parentPath.replaceWith(
          createIfStatement(
            node.test,
            createAssignment(operator, id, node.consequent),
            createAssignment(operator, id, node.alternate)
          )
        );

        path.stop();
        selectNode(parentPath.parentPath.parent);
        return;
      }

      // Scenario `const mode = isVIP ? "vip" : "normal"`
      if (
        ast.isVariableDeclarator(parent) &&
        ast.isVariableDeclaration(parentPath.parent)
      ) {
        const id = parent.id;

        parentPath.parentPath.replaceWithMultiple([
          createLetDeclaration(id),
          createIfStatement(
            node.test,
            createValueAssignment(id, node.consequent),
            createValueAssignment(id, node.alternate)
          )
        ]);

        path.stop();
        selectNode(parentPath.parentPath.node);
        return;
      }
    }
  }));
}

function createIfStatement(
  test: ast.Expression,
  leftStatement: ast.Statement,
  rightStatement: ast.Statement
): ast.IfStatement {
  return ast.ifStatement(
    test,
    ast.blockStatement([leftStatement]),
    ast.blockStatement([rightStatement])
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
