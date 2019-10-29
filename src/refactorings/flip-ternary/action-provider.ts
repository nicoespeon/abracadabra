import {
  createActionProviderFor,
  RefactoringActionProvider
} from "../../action-providers";

import { commandKey } from "./command";
import { hasTernaryToFlip } from "./flip-ternary";

class FlipTernaryActionProvider extends RefactoringActionProvider {
  actionMessage = "Flip ternary";
  commandKey = commandKey;
  title = "Flip Ternary";
  canPerformRefactoring = hasTernaryToFlip;
  isPreferred = true;
}

export default createActionProviderFor(new FlipTernaryActionProvider());
