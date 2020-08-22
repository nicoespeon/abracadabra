import { renameSymbol } from "./rename-symbol";

import { Refactoring } from "../../types";

const config: Refactoring = {
  command: {
    key: "renameSymbol",
    operation: renameSymbol
  }
};

export default config;
