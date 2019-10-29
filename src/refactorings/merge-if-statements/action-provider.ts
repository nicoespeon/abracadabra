import {
  createActionProviderFor,
  RefactoringActionProvider
} from "../../action-providers";

import { commandKey } from "./command";
import { tryMergeIfStatements } from "./merge-if-statements";
import { Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";

class MergeIfStatementsActionProvider extends RefactoringActionProvider {
  title = "Merge If Statements";
  commandKey = commandKey;

  canPerformRefactoring(code: Code, selection: Selection) {
    const { mergeAlternate, canMerge } = tryMergeIfStatements(code, selection);
    this.actionMessage = mergeAlternate
      ? "Merge else-if"
      : "Merge if statements";

    return canMerge;
  }
}

export default createActionProviderFor(new MergeIfStatementsActionProvider());
