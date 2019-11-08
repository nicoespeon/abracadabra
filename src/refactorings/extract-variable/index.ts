import { extractVariable } from "./extract-variable";

import { Refactoring } from "../../types";

const config: Refactoring = {
  command: {
    key: "extractVariable",
    operation: extractVariable
  }
};

export default config;
