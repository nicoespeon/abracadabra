import { RefactoringWithActionProviderConfig__DEPRECATED } from "../../refactorings";
import { createVisitor, splitIfStatement } from "./split-if-statement";

const config: RefactoringWithActionProviderConfig__DEPRECATED = {
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
