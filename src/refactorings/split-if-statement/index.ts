import { createVisitor, splitIfStatement } from "./split-if-statement";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
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
