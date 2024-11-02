import { renameSymbol } from "./rename-symbol";
import { RefactoringConfig__NEW } from "../../refactorings";

const config: RefactoringConfig = {
  command: {
    key: "renameSymbol",
    operation: renameSymbol
  }
};

export default config;
