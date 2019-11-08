import { hasDeadCode, removeDeadCode } from "./remove-dead-code";

import { xxxnew_RefactoringWithActionProvider } from "../../types";

const config: xxxnew_RefactoringWithActionProvider = {
  command: {
    key: "removeDeadCode",
    operation: removeDeadCode,
    title: "Remove Dead Code"
  },
  actionProvider: {
    message: "Remove dead code",
    canPerform: hasDeadCode,
    isPreferred: true
  }
};

export default config;
