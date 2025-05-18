import { first, last } from "../../array";
import * as t from "../../ast";
import { Position } from "../../editor/position";
import { Selection } from "../../editor/selection";
import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export function extractFunction(state: RefactoringState): EditorCommand {
  if (state.state !== "new") {
    return COMMANDS.showErrorDidNotFind("code to be extracted");
  }

  const { code, selection } = state;
  const updatedSelection = expandSelectionToClosestStatement(code, selection);

  // Editor built-in extraction works fine => ok to delegate the work for now.
  return updatedSelection.isEqualTo(selection)
    ? COMMANDS.delegate("extract function")
    : COMMANDS.delegate("extract function", updatedSelection);
}

function expandSelectionToClosestStatement(
  code: string,
  selection: Selection
): Selection {
  let result = selection;

  t.traverseAST(
    t.parse(code),
    createVisitor(selection, (path) => {
      if (t.isBlockStatement(path.node)) {
        const firstStatementInBody = first(path.node.body);
        if (!t.isSelectableNode(firstStatementInBody)) return;

        const lastStatementInBody = last(path.node.body);
        if (!t.isSelectableNode(lastStatementInBody)) return;

        result = Selection.fromPositions(
          Position.fromAST(firstStatementInBody.loc.start),
          Position.fromAST(lastStatementInBody.loc.end)
        );
      } else {
        result = Selection.fromAST(path.node.loc);
      }
    })
  );

  return result;
}

function createVisitor(
  selection: Selection,
  onMatch: (path: t.SelectablePath) => void
): t.TraverseOptions {
  return {
    enter(path) {
      if (!t.isStatement(path)) return;
      if (!selection.isInsidePath(path)) return;

      // Since we visit nodes from parent to children, first check
      // if a child would match the selection closer.
      if (hasChildWhichMatchesSelection(path, selection)) return;

      onMatch(path);
    }
  };
}

function hasChildWhichMatchesSelection(
  path: t.NodePath,
  selection: Selection
): boolean {
  let result = false;

  path.traverse({
    enter(childPath) {
      if (!t.isStatement(childPath)) return;
      if (!selection.isInsidePath(childPath)) return;

      result = true;
      childPath.stop();
    }
  });

  return result;
}
