import { RefactoringWithActionProviderConfig__NEW } from "../../refactorings";
import { createVisitor, extractInterface } from "./extract-interface";

const config: RefactoringWithActionProviderConfig__NEW = {
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
