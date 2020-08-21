import { hasTernaryToFlip, flipTernary } from "./flip-ternary";

import { DeprecatedRefactoringWithActionProvider } from "../../types";

const config: DeprecatedRefactoringWithActionProvider = {
  command: {
    key: "flipTernary",
    operation: flipTernary,
    title: "Flip Ternary"
  },
  actionProvider: {
    message: "Flip ternary",
    createVisitor: hasTernaryToFlip,
    isPreferred: true
  }
};

export default config;
