import { createVisitor, flipOperator } from "./flip-operator";

import { RefactoringWithActionProvider } from "../../refactorings";

const config: RefactoringWithActionProvider = {
  command: {
    key: "flipOperator",
    operation: flipOperator,
    title: "Flip Operator"
  },
  actionProvider: {
    message: "Flip operator",
    createVisitor
  }
};

export default config;
