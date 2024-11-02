import { createVisitor, mergeIfStatements } from "./merge-if-statements";

import { RefactoringWithActionProvider } from "../../refactorings";
import * as t from "../../ast";

const config: RefactoringWithActionProvider = {
  command: {
    key: "mergeIfStatements",
    operation: mergeIfStatements,
    title: "Merge If Statements"
  },
  actionProvider: {
    message: "Merge if statements",
    createVisitor,
    updateMessage(path: t.NodePath) {
      const { alternate } = path.node as t.IfStatement;
      return alternate ? "Merge else-if" : "Merge if statements";
    }
  }
};

export default config;
