import * as t from "../../ast";
import { Selection } from "../../editor/selection";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export function extractParameter(state: RefactoringState): EditorCommand {
  const updatedCode = updateCode(t.parse(state.code), state.selection);

  if (!updatedCode.hasCodeChanged) {
    return COMMANDS.showErrorDidNotFind("a parameter to extract");
  }

  return COMMANDS.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path, functionPath) => {
      const variableDeclaration = path.node;
      const assignmentPattern = t.assignmentPattern(
        // VariableDeclarator[id] includes AssignmentPattern, RestElement and TSParameterProperty which are not included in AssignmentPattern[left]
        // AssignmentPattern[left] includes a subset of VariableDeclarator[id]
        // @ts-expect-error - i don't know how to remove this TS error
        variableDeclaration.id,
        variableDeclaration.init
      );
      functionPath.node.params.push(assignmentPattern);
      path.remove();
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.NodePath<t.VariableDeclarator>,
    functionPath: t.NodePath<
      | t.FunctionDeclaration
      | t.FunctionExpression
      | t.ArrowFunctionExpression
      | t.ObjectMethod
      | t.ClassMethod
      | t.ClassPrivateMethod
    >
  ) => void
): t.Visitor {
  return {
    VariableDeclarator: (path) => {
      if (!selection.isInsidePath(path)) return;
      if (path.node.init === null) return;

      const functionPath = path.parentPath.parentPath?.parentPath;
      if (
        !functionPath?.isFunctionDeclaration() &&
        !functionPath?.isFunctionExpression() &&
        !functionPath?.isArrowFunctionExpression() &&
        !functionPath?.isObjectMethod() &&
        !functionPath?.isClassMethod() &&
        !functionPath?.isClassPrivateMethod()
      ) {
        return;
      }

      onMatch(path, functionPath);
    }
  };
}
