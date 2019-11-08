import {
  hasBracesToRemoveFromArrowFunction,
  removeBracesFromArrowFunction
} from "./remove-braces-from-arrow-function";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey: "abracadabra.removeBracesFromArrowFunction",
  operation: removeBracesFromArrowFunction,
  title: "Remove Braces from Arrow Function",
  actionProviderMessage: "Remove braces from arrow function",
  canPerformRefactoring: hasBracesToRemoveFromArrowFunction
};

export default config;
