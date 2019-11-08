import { findNegatableExpression, negateExpression } from "./negate-expression";

import { Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "negateExpression",
    operation: negateExpression,
    title: "Negate Expression"
  },
  actionProvider: {
    message: "Negate the expression",

    canPerform(code: Code, selection: Selection) {
      const expression = findNegatableExpression(code, selection);

      this.message = "Negate the expression";
      if (expression && expression.negatedOperator) {
        this.message += ` (use ${expression.negatedOperator} instead)`;
      }

      return Boolean(expression);
    }
  }
};

export default config;
