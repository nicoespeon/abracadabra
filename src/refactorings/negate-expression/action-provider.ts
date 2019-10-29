import {
  createActionProviderFor,
  RefactoringActionProvider
} from "../../action-providers";

import { commandKey } from "./command";
import { findNegatableExpression } from "./negate-expression";
import { Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";

class NegateExpressionActionProvider extends RefactoringActionProvider {
  actionMessage = "Convert to forEach";
  commandKey = commandKey;
  title = "Negate Expression";

  canPerformRefactoring(code: Code, selection: Selection) {
    const expression = findNegatableExpression(code, selection);

    this.actionMessage = "Negate the expression";
    if (expression && expression.negatedOperator) {
      this.actionMessage += ` (use ${expression.negatedOperator} instead)`;
    }

    return Boolean(expression);
  }
}

export default createActionProviderFor(new NegateExpressionActionProvider());
