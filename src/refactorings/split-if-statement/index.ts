import { createVisitor, splitIfStatement } from "./split-if-statement";

import { RefactoringWithActionProviderConfig } from "../../refactorings";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "splitIfStatement",
    operation: splitIfStatement,
    title: "Split If Statement"
  },
  actionProvider: {
    message: "Split if statement",
    createVisitor
  }
};

export default config;
