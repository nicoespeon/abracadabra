import { createVisitor, flipTernary } from "./flip-ternary";

import { RefactoringWithActionProviderConfig } from "../../refactorings";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "flipTernary",
    operation: flipTernary,
    title: "Flip Ternary"
  },
  actionProvider: {
    message: "Flip ternary",
    createVisitor,
    isPreferred: true
  }
};

export default config;
