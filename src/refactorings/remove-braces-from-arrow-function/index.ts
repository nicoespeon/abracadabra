import { commandKey } from "./command";
import { hasBracesToRemoveFromArrowFunction } from "./remove-braces-from-arrow-function";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey,
  title: "Remove Braces from Arrow Function",
  actionProviderMessage: "Remove braces from arrow function",
  canPerformRefactoring: hasBracesToRemoveFromArrowFunction
};

export default config;
