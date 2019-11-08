import { extractVariable } from "./extract-variable";

import { Refactoring } from "../../types";

const config: Refactoring = {
  commandKey: "extractVariable",
  operation: extractVariable
};

export default config;
