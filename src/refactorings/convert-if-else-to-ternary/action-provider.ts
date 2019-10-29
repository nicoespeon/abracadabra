import {
  createActionProviderFor,
  RefactoringActionProvider
} from "../../action-providers";

import { commandKey } from "./command";
import { hasIfElseToConvert } from "./convert-if-else-to-ternary";

class ConvertIfElseToTernaryActionProvider extends RefactoringActionProvider {
  actionMessage = "Convert if/else to ternary";
  commandKey = commandKey;
  title = "Convert If/Else to Ternary";
  canPerformRefactoring = hasIfElseToConvert;
}

export default createActionProviderFor(
  new ConvertIfElseToTernaryActionProvider()
);
