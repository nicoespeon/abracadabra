import { RefactoringConfig__NEW } from "../../refactorings";
import { renameSymbol } from "./rename-symbol";

const config: RefactoringConfig__NEW = {
  command: {
    key: "renameSymbol",
    operation: renameSymbol
  }
};

export default config;
