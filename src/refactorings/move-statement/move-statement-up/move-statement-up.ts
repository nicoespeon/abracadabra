import { Selection } from "../../../editor/selection";
import { RefactoringState } from "../../../refactorings";
import {
  attemptToMovePathStatementUp,
  commentsHeight,
  getSelectablePathAbove,
  moveStatement
} from "../move-statement";

export function moveStatementUp(state: RefactoringState) {
  return moveStatement(state, (path, selection) => {
    const result = attemptToMovePathStatementUp(path);
    if (!result) return { status: "not found" };

    if (result === "first statement") {
      return { status: "out-of-bound statement" };
    }

    const pathAbove = getSelectablePathAbove(path);
    if (!pathAbove) return { status: "not found" };

    const pathAboveSelection = Selection.fromAST(pathAbove.node.loc);
    const pathBelowSelection = Selection.fromAST(path.node.loc);

    return {
      status: "found",
      ...result,
      newCursorPosition: pathAboveSelection.start
        .putAtSameCharacter(selection.start)
        .addLines(commentsHeight(path, pathBelowSelection))
    };
  });
}
