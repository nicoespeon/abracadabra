import {
  createActionProviderFor,
  RefactoringActionProvider
} from "../../action-providers";

import { commandKey } from "./command";
import { hasRedundantElse } from "./remove-redundant-else";

class RemoveRedundantElseActionProvider extends RefactoringActionProvider {
  actionMessage = "Remove redundant else";
  commandKey = commandKey;
  title = "Remove Redundant Else";
  canPerformRefactoring = hasRedundantElse;
  isPreferred = true;
}

export default createActionProviderFor(new RemoveRedundantElseActionProvider());
