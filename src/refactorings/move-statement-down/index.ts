import { moveStatementDown } from "./move-statement-down";

import { Refactoring } from "../../types";

const config: Refactoring = {
  command: {
    key: "moveStatementDown",
    operation: moveStatementDown
  }
};

export default config;
