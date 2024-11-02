import { moveStatementDown } from "./move-statement-down";

import { Refactoring } from "../../refactorings";

const config: Refactoring = {
  command: {
    key: "moveStatementDown",
    operation: moveStatementDown
  }
};

export default config;
