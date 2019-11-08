import { tryMergeIfStatements, mergeIfStatements } from "./merge-if-statements";

import { Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "mergeIfStatements",
    operation: mergeIfStatements,
    title: "Merge If Statements"
  },
  actionProvider: {
    message: "Merge if statements",

    canPerform(code: Code, selection: Selection) {
      const { mergeAlternate, canMerge } = tryMergeIfStatements(
        code,
        selection
      );
      this.message = mergeAlternate ? "Merge else-if" : "Merge if statements";

      return canMerge;
    }
  }
};

export default config;
