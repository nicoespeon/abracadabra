import { moveStatementUp } from "./move-statement-up";

import { RefactoringConfig } from "../../refactorings";

const config: RefactoringConfig = {
  command: {
    key: "moveStatementUp",
    operation: moveStatementUp
  }
};

export default config;
