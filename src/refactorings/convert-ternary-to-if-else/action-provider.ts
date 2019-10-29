import {
  createActionProviderFor,
  RefactoringActionProvider
} from "../../action-providers";

import { commandKey } from "./command";
import { hasTernaryToConvert } from "./convert-ternary-to-if-else";

class ConvertTernaryToIfElseActionProvider extends RefactoringActionProvider {
  actionMessage = "Convert ternary to if/else";
  commandKey = commandKey;
  title = "Convert Ternary To If/Else";
  canPerformRefactoring = hasTernaryToConvert;
}

export default createActionProviderFor(
  new ConvertTernaryToIfElseActionProvider()
);
