import {
  createActionProviderFor,
  RefactoringActionProvider
} from "../../action-providers";

import { commandKey } from "./command";
import { hasArrowFunctionToAddBraces } from "./add-braces-to-arrow-function";

class AddBracesToArrowFunctionActionProvider extends RefactoringActionProvider {
  actionMessage = "Add braces to arrow function";
  commandKey = commandKey;
  title = "Add Braces to Arrow Function";
  canPerformRefactoring = hasArrowFunctionToAddBraces;
}

export default createActionProviderFor(
  new AddBracesToArrowFunctionActionProvider()
);
