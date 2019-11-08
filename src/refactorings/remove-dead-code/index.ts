import { commandKey } from "./command";
import { hasDeadCode, removeDeadCode } from "./remove-dead-code";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey,
  operation: removeDeadCode,
  title: "Remove Dead Code",
  actionProviderMessage: "Remove dead code",
  canPerformRefactoring: hasDeadCode,
  isPreferred: true
};

export default config;
