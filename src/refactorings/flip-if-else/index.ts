import { hasIfElseToFlipVisitorFactory, flipIfElse } from "./flip-if-else";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "flipIfElse",
    operation: flipIfElse,
    title: "Flip If/Else"
  },
  actionProvider: {
    message: "Flip if/else",
    canPerformVisitorFactory: hasIfElseToFlipVisitorFactory,
    isPreferred: true
  }
};

export default config;
