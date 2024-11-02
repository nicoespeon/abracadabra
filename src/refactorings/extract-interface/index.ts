import { extractInterface, createVisitor } from "./extract-interface";

import { RefactoringWithActionProviderConfig } from "../../refactorings";

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
