import { moveStatementDown } from "./move-statement-down";

import { RefactoringConfig } from "../../refactorings";

const config: RefactoringConfig = {
  command: {
    key: "moveStatementDown",
    operation: moveStatementDown
  }
};

export default config;
