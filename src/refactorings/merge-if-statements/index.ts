import { tryMergeIfStatements, mergeIfStatements } from "./merge-if-statements";

import { Selection } from "../../editor/selection";
import { xxxnew_RefactoringWithActionProvider } from "../../types";
import * as t from "../../ast";

const config: xxxnew_RefactoringWithActionProvider = {
  command: {
    key: "mergeIfStatements",
    operation: mergeIfStatements,
    title: "Merge If Statements"
  },
  actionProvider: {
    message: "Merge if statements",

    canPerform(ast: t.AST, selection: Selection) {
      const { mergeAlternate, canMerge } = tryMergeIfStatements(ast, selection);
      this.message = mergeAlternate ? "Merge else-if" : "Merge if statements";

      return canMerge;
    }
  }
};

export default config;
