import { extractGenericType } from "./extract-generic-type";

import { Refactoring } from "../../types";

const config: Refactoring = {
  command: {
    key: "extractGenericType",
    operation: extractGenericType
  }
};

export default config;
