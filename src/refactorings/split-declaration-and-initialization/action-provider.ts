import {
  createActionProviderFor,
  RefactoringActionProvider
} from "../../action-providers";

import { commandKey } from "./command";
import { canSplitDeclarationAndInitialization } from "./split-declaration-and-initialization";

class SplitDeclarationAndInitializationActionProvider extends RefactoringActionProvider {
  actionMessage = "Split declaration and initialization";
  commandKey = commandKey;
  title = "Split Declaration and Initialization";
  canPerformRefactoring = canSplitDeclarationAndInitialization;
}

export default createActionProviderFor(
  new SplitDeclarationAndInitializationActionProvider()
);
