import { canNegateExpression, negateExpression } from "./negate-expression";

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
      const expression = canNegateExpression(ast, selection);

      this.message = "Negate the expression";
      if (expression.negatedOperator) {
        this.message += ` (use ${expression.negatedOperator} instead)`;
      }

      return expression.canNegate;
    }
  }
};

export default config;
