import {
  createActionProviderFor,
  RefactoringActionProvider
} from "../../action-providers";

import { commandKey } from "./command";
import { hasIfElseToConvert } from "./convert-if-else-to-switch";

class ConvertIfElseToSwitchActionProvider extends RefactoringActionProvider {
  actionMessage = "Convert if/else to switch";
  commandKey = commandKey;
  title = "Convert If/Else to Switch";
  canPerformRefactoring = hasIfElseToConvert;
  isPreferred = true;
}

export default createActionProviderFor(
  new ConvertIfElseToSwitchActionProvider()
);
