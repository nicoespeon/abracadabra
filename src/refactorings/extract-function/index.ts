import { RefactoringConfig } from "../../refactorings";
import { extractFunction } from "./extract-function";

const config: RefactoringConfig = {
  command: {
    key: "extractFunction",
    operation: extractFunction
  }
};

export default config;
