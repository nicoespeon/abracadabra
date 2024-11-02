import { extractInterface, createVisitor } from "./extract-interface";

import { RefactoringWithActionProvider } from "../../refactorings";

const config: RefactoringWithActionProvider = {
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
