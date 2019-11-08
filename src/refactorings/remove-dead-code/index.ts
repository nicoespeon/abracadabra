import { hasDeadCode, removeDeadCode } from "./remove-dead-code";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey: "abracadabra.removeDeadCode",
  operation: removeDeadCode,
  title: "Remove Dead Code",
  actionProviderMessage: "Remove dead code",
  canPerformRefactoring: hasDeadCode,
  isPreferred: true
};

export default config;
