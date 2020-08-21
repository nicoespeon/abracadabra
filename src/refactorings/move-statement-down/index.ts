import { moveStatementDown } from "./move-statement-down";

import { DeprecatedRefactoring } from "../../types";

const config: DeprecatedRefactoring = {
  command: {
    key: "moveStatementDown",
    operation: moveStatementDown
  }
};

export default config;
