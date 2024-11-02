import { renameSymbol } from "./rename-symbol";
import { Refactoring__NEW } from "../../refactorings";

const config: Refactoring__NEW = {
  command: {
    key: "renameSymbol",
    operation: renameSymbol
  }
};

export default config;
