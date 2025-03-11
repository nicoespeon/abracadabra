import { RefactoringConfig } from "../../../refactorings";
import { moveStatementUp } from "./move-statement-up";

const config: RefactoringConfig = {
  command: {
    key: "moveStatementUp",
    operation: moveStatementUp
  }
};

export default config;
