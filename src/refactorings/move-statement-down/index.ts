import { moveStatementDown } from "./move-statement-down";

import { Refactoring } from "../../types";

const config: Refactoring = {
  commandKey: "moveStatementDown",
  operation: moveStatementDown
};

export default config;
