import {
  canNegateExpressionVisitorFactory,
  negateExpression,
  getNegatedOperator
} from "./negate-expression";

import { RefactoringWithActionProvider } from "../../types";
import * as t from "../../ast";

const config: RefactoringWithActionProvider = {
  command: {
    key: "negateExpression",
    operation: negateExpression,
    title: "Negate Expression"
  },
  actionProvider: {
    message: "Negate the expression",

    canPerformVisitorFactory: canNegateExpressionVisitorFactory,

    canPerformRefactoringMutator(
      path: t.NodePath<any>,
      refactoring: RefactoringWithActionProvider
    ): RefactoringWithActionProvider {
      return {
        ...refactoring,
        actionProvider: {
          ...refactoring.actionProvider,
          message: `${
            refactoring.actionProvider.message
          } (use ${getNegatedOperator(path.node)} instead)`
        }
      };
    }
  }
};

export default config;
