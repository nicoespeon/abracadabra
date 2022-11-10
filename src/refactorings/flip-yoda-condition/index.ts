import { flipYodaCondition, createVisitor } from "./flip-yoda-condition";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "flipYodaCondition",
    operation: flipYodaCondition,
    title: "Flip Yoda Condition"
  },
  actionProvider: {
    message: "Flip yoda condition",
    createVisitor
  }
};

export default config;
