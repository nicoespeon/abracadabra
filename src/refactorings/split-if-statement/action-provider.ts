import {
  createActionProviderFor,
  RefactoringActionProvider
} from "../../action-providers";

import { commandKey } from "./command";
import { canSplitIfStatement } from "./split-if-statement";

class SplitIfStatementActionProvider extends RefactoringActionProvider {
  actionMessage = "Split if statement";
  commandKey = commandKey;
  title = "Split If Statement";
  canPerformRefactoring = canSplitIfStatement;
}

export default createActionProviderFor(new SplitIfStatementActionProvider());
