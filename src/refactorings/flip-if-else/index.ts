import { hasIfElseToFlip, flipIfElse } from "./flip-if-else";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "flipIfElse",
    operation: flipIfElse,
    title: "Flip If/Else"
  },
  actionProvider: {
    message: "Flip if/else",
    canPerform: hasIfElseToFlip,
    isPreferred: true
  }
};

export default config;
