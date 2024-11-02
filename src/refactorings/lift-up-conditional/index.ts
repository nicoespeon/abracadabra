import { createVisitor, liftUpConditional } from "./lift-up-conditional";

import { RefactoringWithActionProviderConfig } from "../../refactorings";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "liftUpConditional",
    operation: liftUpConditional,
    title: "Lift Up Conditional"
  },
  actionProvider: {
    message: "Lift up conditional",
    createVisitor,
    isPreferred: true
  }
};

export default config;
