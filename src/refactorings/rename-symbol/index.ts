import { RefactoringConfig } from "../../refactorings";
import { renameSymbol } from "./rename-symbol";

const config: RefactoringConfig = {
  command: {
    key: "renameSymbol",
    operation: renameSymbol
  }
};

export default config;
