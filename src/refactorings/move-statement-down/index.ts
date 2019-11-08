import { moveStatementDown } from "./move-statement-down";

import { Refactoring } from "../../types";

const config: Refactoring = {
  commandKey: "abracadabra.moveStatementDown",
  operation: moveStatementDown
};

export default config;
