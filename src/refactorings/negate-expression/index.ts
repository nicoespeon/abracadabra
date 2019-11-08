import { findNegatableExpression, negateExpression } from "./negate-expression";

import { Selection } from "../../editor/selection";
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

    canPerform(ast: t.AST, selection: Selection) {
      const expression = findNegatableExpression(ast, selection);

      this.message = "Negate the expression";
      if (expression && expression.negatedOperator) {
        this.message += ` (use ${expression.negatedOperator} instead)`;
      }

      return Boolean(expression);
    }
  }
};

export default config;
