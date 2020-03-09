import { canMergeIfStatements, mergeIfStatements } from "./merge-if-statements";

import { Selection } from "../../editor/selection";
import { RefactoringWithActionProvider } from "../../types";
import * as t from "../../ast";

const config: RefactoringWithActionProvider = {
  command: {
    key: "mergeIfStatements",
    operation: mergeIfStatements,
    title: "Merge If Statements"
  },
  actionProvider: {
    message: "Merge if statements",

    canPerform(ast: t.AST, selection: Selection) {
      const { mergeAlternate, canMerge } = canMergeIfStatements(ast, selection);
      this.message = mergeAlternate ? "Merge else-if" : "Merge if statements";

      return canMerge;
    }
  }
};

export default config;
