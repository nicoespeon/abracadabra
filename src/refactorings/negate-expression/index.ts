import {
  canNegateExpression,
  negateExpression,
  getNegatedOperator
} from "./negate-expression";

import { DeprecatedRefactoringWithActionProvider } from "../../types";

const config: DeprecatedRefactoringWithActionProvider = {
  command: {
    key: "negateExpression",
    operation: negateExpression,
    title: "Negate Expression"
  },
  actionProvider: {
    message: "Negate the expression",
    createVisitor: canNegateExpression,
    updateMessage(path) {
      const operator = getNegatedOperator(path.node);
      return `Negate the expression (use ${operator} instead)`;
    }
  }
};

export default config;
