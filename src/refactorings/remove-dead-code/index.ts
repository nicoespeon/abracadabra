import { createVisitor, removeDeadCode } from "./remove-dead-code";

import { RefactoringWithActionProvider } from "../../refactorings";

const config: RefactoringWithActionProvider = {
  command: {
    key: "removeDeadCode",
    operation: removeDeadCode,
    title: "Remove Dead Code"
  },
  actionProvider: {
    message: "Remove dead code",
    createVisitor,
    isPreferred: true
  }
};

export default config;
