import { canMergeIfStatements, mergeIfStatements } from "./merge-if-statements";

import { RefactoringWithActionProvider, ActionProvider } from "../../types";
import * as t from "../../ast";

const config: RefactoringWithActionProvider<ActionProvider<t.IfStatement>> = {
  command: {
    key: "mergeIfStatements",
    operation: mergeIfStatements,
    title: "Merge If Statements"
  },
  actionProvider: {
    message: "Merge if statements",
    createVisitor: canMergeIfStatements,
    updateMessage(path) {
      const { alternate } = path.node;
      return alternate ? "Merge else-if" : "Merge if statements";
    }
  }
};

export default config;
