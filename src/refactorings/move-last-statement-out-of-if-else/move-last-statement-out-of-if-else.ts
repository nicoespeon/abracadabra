import { last } from "../../array";
import * as t from "../../ast";
import { Selection } from "../../editor/selection";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export function moveLastStatementOutOfIfElse(
  state: RefactoringState
): EditorCommand {
  const updatedCode = updateCode(t.parse(state.code), state.selection);

  if (!updatedCode.hasCodeChanged) {
    return COMMANDS.showErrorDidNotFind("a statement to move out");
  }

  return COMMANDS.write(updatedCode.code);
}

function updateCode(ast: t.AST, selection: Selection): t.Transformed {
  return t.transformAST(
    ast,
    createVisitor(selection, (path, lastStatement) => {
      const { consequent, alternate } = path.node;
      if (!alternate) return;

      if (t.isBlockStatement(consequent)) {
        consequent.body.pop();
      } else {
        path.node.consequent = t.blockStatement([]);
      }

      if (t.isBlockStatement(alternate)) {
        alternate.body.pop();
      } else {
        path.node.alternate = t.blockStatement([]);
      }

      if (t.isEmpty(consequent)) {
        path.node.consequent = alternate;
        path.node.test = t.getNegatedExpression(path.node.test);
        path.node.alternate = null;
      }

      if (t.isEmpty(alternate)) {
        path.node.alternate = null;
      }

      path.insertAfter(lastStatement);
      path.stop();
    })
  );
}

export function createVisitor(
  selection: Selection,
  onMatch: (path: t.NodePath<t.IfStatement>, lastStatement: t.Statement) => void
): t.Visitor {
  return {
    IfStatement(path) {
      if (!selection.isInsidePath(path)) return;
      if (!path.node.alternate) return;

      const lastConsequentStatement = last(
        t.getStatements(path.node.consequent)
      );
      if (!lastConsequentStatement) return;

      const lastAlternateStatement = last(t.getStatements(path.node.alternate));
      if (!lastAlternateStatement) return;

      if (!t.areEquivalent(lastConsequentStatement, lastAlternateStatement)) {
        return;
      }

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      onMatch(path, lastConsequentStatement);
    }
  };
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    IfStatement(childPath) {
      if (!selection.isInsidePath(childPath)) return;
      if (!childPath.node.alternate) return;

      const lastConsequentStatement = last(
        t.getStatements(childPath.node.consequent)
      );
      if (!lastConsequentStatement) return;

      const lastAlternateStatement = last(
        t.getStatements(childPath.node.alternate)
      );
      if (!lastAlternateStatement) return;

      if (!t.areEquivalent(lastConsequentStatement, lastAlternateStatement)) {
        return;
      }

      result = true;
      childPath.stop();
    }
  });

  return result;
}
