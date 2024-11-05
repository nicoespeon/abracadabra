import { RefactoringWithActionProviderConfig__DEPRECATED } from "../../refactorings";
import { createVisitor, flipOperator } from "./flip-operator";

const config: RefactoringWithActionProviderConfig__DEPRECATED = {
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
