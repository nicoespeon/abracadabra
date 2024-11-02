import { moveStatementUp } from "./move-statement-up";

import { Refactoring } from "../../refactorings";

const config: Refactoring = {
  command: {
    key: "moveStatementUp",
    operation: moveStatementUp
  }
};

export default config;
