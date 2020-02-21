import { canMergeIfStatements, mergeIfStatements } from "./merge-if-statements";

import { RefactoringWithActionProvider } from "../../types";
import * as t from "../../ast";
import { NodePath } from "../../ast";

const config: RefactoringWithActionProvider = {
  command: {
    key: "mergeIfStatements",
    operation: mergeIfStatements,
    title: "Merge If Statements"
  },
  actionProvider: {
    message: "Merge if statements",
    createVisitor: canMergeIfStatements,
    updateMessage(path: NodePath<t.IfStatement>) {
      const { alternate } = path.node;
      this.message = alternate ? "Merge else-if" : "Merge if statements";
    }
  }
};

export default config;
