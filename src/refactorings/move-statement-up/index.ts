import { RefactoringConfig__DEPRECATED } from "../../refactorings";
import { moveStatementUp } from "./move-statement-up";

const config: RefactoringConfig__DEPRECATED = {
  command: {
    key: "moveStatementUp",
    operation: moveStatementUp
  }
};

export default config;
