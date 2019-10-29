import {
  createActionProviderFor,
  RefactoringActionProvider
} from "../../action-providers";

import { commandKey } from "./command";
import { hasIfElseToFlip } from "./flip-if-else";

class FlipIfElseActionProvider extends RefactoringActionProvider {
  actionMessage = "Flip if/else";
  commandKey = commandKey;
  title = "Flip If/Else";
  canPerformRefactoring = hasIfElseToFlip;
  isPreferred = true;
}

export default createActionProviderFor(new FlipIfElseActionProvider());
