import { hasTernaryToFlip, flipTernary } from "./flip-ternary";

import { xxxnew_RefactoringWithActionProvider } from "../../types";

const config: xxxnew_RefactoringWithActionProvider = {
  command: {
    key: "flipTernary",
    operation: flipTernary,
    title: "Flip Ternary"
  },
  actionProvider: {
    message: "Flip ternary",
    canPerform: hasTernaryToFlip,
    isPreferred: true
  }
};

export default config;
