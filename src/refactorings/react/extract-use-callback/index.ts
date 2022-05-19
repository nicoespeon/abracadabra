import { RefactoringWithActionProvider } from "../../../types";
import { extractUseCallback, createVisitor } from "./extract-use-callback";

const config: RefactoringWithActionProvider = {
  command: {
    key: "extractUseCallback",
    operation: extractUseCallback,
    title: "Extract to useCallback"
  },
  actionProvider: {
    message: "Extract to useCallback",
    createVisitor
  }
};

export default config;
