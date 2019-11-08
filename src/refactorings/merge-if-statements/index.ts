import { tryMergeIfStatements, mergeIfStatements } from "./merge-if-statements";

import { Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey: "mergeIfStatements",
  operation: mergeIfStatements,
  title: "Merge If Statements",
  actionProviderMessage: "Merge if statements",

  canPerformRefactoring(code: Code, selection: Selection) {
    const { mergeAlternate, canMerge } = tryMergeIfStatements(code, selection);
    this.actionProviderMessage = mergeAlternate
      ? "Merge else-if"
      : "Merge if statements";

    return canMerge;
  }
};

export default config;
