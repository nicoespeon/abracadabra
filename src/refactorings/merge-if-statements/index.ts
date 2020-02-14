import {
  canMergeStatementsVisitorFactory,
  mergeIfStatements
} from "./merge-if-statements";

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

    canPerformVisitorFactory: canMergeStatementsVisitorFactory,

    canPerformRefactoringMutator(
      path: t.NodePath<any>,
      refactoring: RefactoringWithActionProvider
    ): RefactoringWithActionProvider {
      const { alternate } = path.node;

      return {
        ...refactoring,
        actionProvider: {
          ...refactoring.actionProvider,
          message: alternate ? "Merge else-if" : "Merge if statements"
        }
      };
    }
  }
};

export default config;
