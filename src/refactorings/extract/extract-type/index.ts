import { extractType } from "./extract-type";

import { Refactoring } from "../../../types";

const config: Refactoring = {
  command: {
    key: "extractType",
    operation: extractType
  }
};

export default config;
