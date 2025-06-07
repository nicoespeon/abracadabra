import { RefactoringWithActionProviderConfig } from "../../refactorings";
import { createVisitor, extractParameter } from "./extract-parameter";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "extractParameter",
    operation: extractParameter,
    title: "Extract Parameter"
  },
  actionProvider: {
    message: "Extract parameter",
    createVisitor
  }
};

export default config;
