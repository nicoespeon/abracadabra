import {
  createActionProviderFor,
  RefactoringActionProvider
} from "../../action-providers";

import { commandKey } from "./command";
import { canConvertForLoop } from "./convert-for-to-foreach";

class ConvertForToForeachActionProvider extends RefactoringActionProvider {
  actionMessage = "Convert to forEach";
  commandKey = commandKey;
  title = "Convert For-Loop to ForEach";
  canPerformRefactoring = canConvertForLoop;
  isPreferred = true;
}

export default createActionProviderFor(new ConvertForToForeachActionProvider());
