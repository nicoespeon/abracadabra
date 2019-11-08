import { hasTernaryToFlip, flipTernary } from "./flip-ternary";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey: "flipTernary",
  operation: flipTernary,
  title: "Flip Ternary",
  actionProviderMessage: "Flip ternary",
  canPerformRefactoring: hasTernaryToFlip,
  isPreferred: true
};

export default config;
