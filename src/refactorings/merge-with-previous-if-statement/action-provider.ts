import {
  createActionProviderFor,
  RefactoringActionProvider
} from "../../action-providers";

import { commandKey } from "./command";
import { canMergeWithPreviousIf } from "./merge-with-previous-if-statement";

class MergeWithPreviousIfStatementActionProvider extends RefactoringActionProvider {
  actionMessage = "Merge with previous if";
  commandKey = commandKey;
  title = "Merge With Previous If Statement";
  canPerformRefactoring = canMergeWithPreviousIf;
  isPreferred = true;
}

export default createActionProviderFor(
  new MergeWithPreviousIfStatementActionProvider()
);
