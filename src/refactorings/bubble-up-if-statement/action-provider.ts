import {
  createActionProviderFor,
  RefactoringActionProvider
} from "../../action-providers";

import { commandKey } from "./command";
import { canBubbleUpIfStatement } from "./bubble-up-if-statement";

class BubbleUpIfStatementActionProvider extends RefactoringActionProvider {
  actionMessage = "Bubble up if statement";
  commandKey = commandKey;
  title = "Bubble Up If Statement";
  canPerformRefactoring = canBubbleUpIfStatement;
  isPreferred = true;
}

export default createActionProviderFor(new BubbleUpIfStatementActionProvider());
