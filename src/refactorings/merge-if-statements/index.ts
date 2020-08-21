import { canMergeIfStatements, mergeIfStatements } from "./merge-if-statements";

import { DeprecatedRefactoringWithActionProvider } from "../../types";
import * as t from "../../ast";

const config: DeprecatedRefactoringWithActionProvider = {
  command: {
    key: "mergeIfStatements",
    operation: mergeIfStatements,
    title: "Merge If Statements"
  },
  actionProvider: {
    message: "Merge if statements",
    createVisitor: canMergeIfStatements,
    updateMessage(path: t.NodePath) {
      const { alternate } = path.node as t.IfStatement;
      return alternate ? "Merge else-if" : "Merge if statements";
    }
  }
};

export default config;
