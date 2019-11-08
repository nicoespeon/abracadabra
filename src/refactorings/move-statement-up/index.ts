import { moveStatementUp } from "./move-statement-up";

import { Refactoring } from "../../types";

const config: Refactoring = {
  commandKey: "moveStatementUp",
  operation: moveStatementUp
};

export default config;
