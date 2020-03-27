import {
  canNegateExpression,
  negateExpression,
  getNegatedOperator
} from "./negate-expression";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "negateExpression",
    operation: negateExpression,
    title: "Negate Expression"
  },
  actionProvider: {
    message: "Negate the expression",
    createVisitor: canNegateExpression,
    updateMessage(path) {
      return `Negate the expression (use ${getNegatedOperator(
        path.node
      )} instead)`;
    }
  }
};

export default config;
