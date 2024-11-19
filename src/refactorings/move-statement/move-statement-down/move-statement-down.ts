import { Position } from "../../../editor/position";
import { Selection } from "../../../editor/selection";
import { EditorCommand, RefactoringState } from "../../../refactorings";
import {
  attemptToMovePathStatementUp,
  getSelectablePathBelow,
  moveStatement
} from "../move-statement";

export function moveStatementDown(state: RefactoringState): EditorCommand {
  return moveStatement(state, (path, selection) => {
    const pathBelow = getSelectablePathBelow(path);
    if (!pathBelow) {
      return { status: "out-of-bound statement" };
    }

    const result = attemptToMovePathStatementUp(pathBelow);
    if (!result) return { status: "not found" };

    if (result === "first statement") {
      return { status: "out-of-bound statement" };
    }

    const pathAboveSelection = Selection.fromAST(path.node.loc);
    const pathBelowSelection = Selection.fromAST(pathBelow.node.loc);
    const statementsHeightDiff =
      pathBelowSelection.height - pathAboveSelection.height;

    return {
      status: "found",
      ...result,
      newCursorPosition: Position.fromAST(pathBelow.node.loc.start)
        .putAtSameCharacter(selection.start)
        .addLines(statementsHeightDiff)
    };
  });
}
