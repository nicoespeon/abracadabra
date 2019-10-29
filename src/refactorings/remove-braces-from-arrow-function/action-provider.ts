import {
  createActionProviderFor,
  RefactoringActionProvider
} from "../../action-providers";

import { commandKey } from "./command";
import { hasBracesToRemoveFromArrowFunction } from "./remove-braces-from-arrow-function";

class RemoveBracesFromArrowFunctionActionProvider extends RefactoringActionProvider {
  actionMessage = "Remove braces from arrow function";
  commandKey = commandKey;
  title = "Remove Braces from Arrow Function";
  canPerformRefactoring = hasBracesToRemoveFromArrowFunction;
}

export default createActionProviderFor(
  new RemoveBracesFromArrowFunctionActionProvider()
);
