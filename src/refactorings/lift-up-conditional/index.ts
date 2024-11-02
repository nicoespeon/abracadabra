import { createVisitor, liftUpConditional } from "./lift-up-conditional";

import { RefactoringWithActionProvider } from "../../refactorings";

const config: RefactoringWithActionProvider = {
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
