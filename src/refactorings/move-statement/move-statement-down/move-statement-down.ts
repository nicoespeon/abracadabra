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

    const attemptResult = attemptToMovePathStatementUp(pathBelow, selection);
    if (!attemptResult) return { status: "not found" };

    if (attemptResult === "first statement") {
      return { status: "out-of-bound statement" };
    }

    const statementSelection = Selection.fromAST(path.node.loc);
    const nextStatementSelection = Selection.fromAST(pathBelow.node.loc);
    const statementsHeightDiff =
      nextStatementSelection.height - statementSelection.height;

    return {
      status: "found",
      ...attemptResult,
      newCursorPosition: Position.fromAST(pathBelow.node.loc.start)
        .putAtSameCharacter(selection.start)
        .addLines(statementsHeightDiff)
    };
  });
}
