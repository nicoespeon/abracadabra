import { RefactoringWithActionProviderConfig } from "../../refactorings";
import { createVisitor, extractInterface } from "./extract-interface";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "extractInterface",
    operation: extractInterface,
    title: "Extract Interface"
  },
  actionProvider: {
    message: "Extract interface",
    createVisitor
  }
};

export default config;
