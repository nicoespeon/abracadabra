import { RefactoringWithActionProviderConfig } from "../../refactorings";
import { createVisitor, liftUpConditional } from "./lift-up-conditional";

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
