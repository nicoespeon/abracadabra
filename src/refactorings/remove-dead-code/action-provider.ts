import {
  createActionProviderFor,
  RefactoringActionProvider
} from "../../action-providers";

import { commandKey } from "./command";
import { hasDeadCode } from "./remove-dead-code";

class RemoveDeadCodeActionProvider extends RefactoringActionProvider {
  actionMessage = "Remove dead code";
  commandKey = commandKey;
  title = "Remove Dead Code";
  canPerformRefactoring = hasDeadCode;
  isPreferred = true;
}

export default createActionProviderFor(new RemoveDeadCodeActionProvider());
