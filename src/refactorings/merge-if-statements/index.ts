import * as t from "../../ast";
import { RefactoringWithActionProviderConfig } from "../../refactorings";
import { createVisitor, mergeIfStatements } from "./merge-if-statements";

const config: RefactoringWithActionProviderConfig = {
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
