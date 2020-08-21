import { moveStatementUp } from "./move-statement-up";

import { DeprecatedRefactoring } from "../../types";

const config: DeprecatedRefactoring = {
  command: {
    key: "moveStatementUp",
    operation: moveStatementUp
  }
};

export default config;
