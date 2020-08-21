import { hasIfElseToFlip, flipIfElse } from "./flip-if-else";

import { DeprecatedRefactoringWithActionProvider } from "../../types";

const config: DeprecatedRefactoringWithActionProvider = {
  command: {
    key: "flipIfElse",
    operation: flipIfElse,
    title: "Flip If/Else"
  },
  actionProvider: {
    message: "Flip if/else",
    createVisitor: hasIfElseToFlip,
    isPreferred: true
  }
};

export default config;
