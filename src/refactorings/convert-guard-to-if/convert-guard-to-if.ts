import * as t from "../../ast";
import { Selection } from "../../editor/selection";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export function convertGuardToIf(state: RefactoringState): EditorCommand {
  const updatedCode = updateCode(t.parse(state.code), state.selection);

  if (!updatedCode.hasCodeChanged) {
    return COMMANDS.showErrorDidNotFind(
      "a logical expression using '&&' where the right hand side is a function call"
    );
  }

  return COMMANDS.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path: t.NodePath<t.LogicalExpression>) => {
      const { parentPath, node } = path;
      t.replaceWithPreservingComments(
        parentPath,
        t.ifStatement(
          node.left,
          t.blockStatement([t.expressionStatement(node.right)])
        )
      );
      parentPath.stop();
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.LogicalExpression>) => void
): t.Visitor {
  return {
    LogicalExpression(path) {
      if (!selection.isInsidePath(path)) return;
      if (t.isReturnStatement(path.parent)) return;
      if (!isGuardForCallback(path)) return;

      onMatch(path);
    }
  };
}

function isGuardForCallback({
  node
}: t.NodePath<t.LogicalExpression>): boolean {
  return node.operator === "&&" && t.isCallExpression(node.right);
}
