import { canliftUpConditional, liftUpConditional } from "./lift-up-conditional";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "liftUpConditional",
    operation: liftUpConditional,
    title: "Lift Up Conditional"
  },
  actionProvider: {
    message: "Lift up conditional",
    createVisitor: canliftUpConditional,
    isPreferred: true
  }
};

export default config;
