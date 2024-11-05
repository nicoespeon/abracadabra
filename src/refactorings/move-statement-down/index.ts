import { RefactoringConfig__DEPRECATED } from "../../refactorings";
import { moveStatementDown } from "./move-statement-down";

const config: RefactoringConfig__DEPRECATED = {
  command: {
    key: "moveStatementDown",
    operation: moveStatementDown
  }
};

export default config;
