import { RefactoringWithActionProviderConfig } from "../../refactorings";
import {
  createVisitor,
  getNegatedOperator,
  invertBooleanLogic
} from "./invert-boolean-logic";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "invertBooleanLogic",
    operation: invertBooleanLogic,
    title: "Invert Boolean Logic (De Morgan's Law)"
  },
  actionProvider: {
    message: "Invert boolean logic (De Morgan's law)",
    createVisitor,
    updateMessage(path) {
      const operator = getNegatedOperator(path.node);
      return operator
        ? `Invert boolean logic (use ${operator} instead) (De Morgan's law)`
        : "Invert boolean logic (De Morgan's law)";
    }
  }
};

export default config;
