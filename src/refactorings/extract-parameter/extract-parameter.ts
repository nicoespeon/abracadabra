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
      const assignmentPattern = t.assignmentPattern(
        // @ts-expect-error - Let's fix this type issue!
        path.node.declarations[0].id,
        path.node.declarations[0].init
      );
      functionPath.node.params.push(assignmentPattern);
      path.remove();
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (
    path: t.NodePath<t.VariableDeclaration>,
    functionPath: t.NodePath<
      t.FunctionDeclaration | t.FunctionExpression | t.ArrowFunctionExpression
    >
  ) => void
): t.Visitor {
  return {
    VariableDeclaration: (path) => {
      if (!selection.isInsidePath(path)) return;
      if (
        !path.parentPath.parentPath?.isFunctionDeclaration() &&
        !path.parentPath.parentPath?.isFunctionExpression() &&
        !path.parentPath.parentPath?.isArrowFunctionExpression()
      )
        return;

      onMatch(path, path.parentPath.parentPath);
    }
  };
}
