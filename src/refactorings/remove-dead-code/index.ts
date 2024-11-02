import { createVisitor, removeDeadCode } from "./remove-dead-code";

import { RefactoringWithActionProviderConfig } from "../../refactorings";

const config: RefactoringWithActionProviderConfig = {
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
