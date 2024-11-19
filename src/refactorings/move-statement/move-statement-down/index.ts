import { RefactoringConfig } from "../../../refactorings";
import { moveStatementDown } from "./move-statement-down";

const config: RefactoringConfig = {
  command: {
    key: "moveStatementDown",
    operation: moveStatementDown
  }
};

export default config;
