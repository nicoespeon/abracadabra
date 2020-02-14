import { hasTernaryToFlipVisitorFactory, flipTernary } from "./flip-ternary";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "flipTernary",
    operation: flipTernary,
    title: "Flip Ternary"
  },
  actionProvider: {
    message: "Flip ternary",
    canPerformVisitorFactory: hasTernaryToFlipVisitorFactory,
    isPreferred: true
  }
};

export default config;
