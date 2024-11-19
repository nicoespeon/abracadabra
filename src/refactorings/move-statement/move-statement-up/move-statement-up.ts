import { RefactoringState } from "../../../refactorings";
import { attemptToMovePathStatementUp, moveStatement } from "../move-statement";

export function moveStatementUp(state: RefactoringState) {
  return moveStatement(state, (path, selection) => {
    const result = attemptToMovePathStatementUp(path, selection);
    if (!result) return { status: "not found" };

    if (result === "first statement") {
      return { status: "out-of-bound statement" };
    }

    return {
      status: "found",
      ...result
    };
  });
}
