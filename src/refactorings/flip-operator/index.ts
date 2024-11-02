import { createVisitor, flipOperator } from "./flip-operator";

import { RefactoringWithActionProviderConfig } from "../../refactorings";

const config: RefactoringWithActionProviderConfig = {
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
