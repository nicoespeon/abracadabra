import { createVisitor, flipIfElse } from "./flip-if-else";

import { RefactoringWithActionProvider } from "../../refactorings";

const config: RefactoringWithActionProvider = {
  command: {
    key: "flipIfElse",
    operation: flipIfElse,
    title: "Flip If/Else"
  },
  actionProvider: {
    message: "Flip if/else",
    createVisitor,
    isPreferred: true
  }
};

export default config;
