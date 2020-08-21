import { hasDeadCode, removeDeadCode } from "./remove-dead-code";

import { DeprecatedRefactoringWithActionProvider } from "../../types";

const config: DeprecatedRefactoringWithActionProvider = {
  command: {
    key: "removeDeadCode",
    operation: removeDeadCode,
    title: "Remove Dead Code"
  },
  actionProvider: {
    message: "Remove dead code",
    createVisitor: hasDeadCode,
    isPreferred: true
  }
};

export default config;
