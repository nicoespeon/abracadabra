import { hasIfElseToFlip, flipIfElse } from "./flip-if-else";

import { xxxnew_RefactoringWithActionProvider } from "../../types";

const config: xxxnew_RefactoringWithActionProvider = {
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
