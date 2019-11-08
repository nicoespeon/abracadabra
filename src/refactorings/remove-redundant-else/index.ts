import { hasRedundantElse, removeRedundantElse } from "./remove-redundant-else";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey: "removeRedundantElse",
  operation: removeRedundantElse,
  title: "Remove Redundant Else",
  actionProviderMessage: "Remove redundant else",
  canPerformRefactoring: hasRedundantElse,
  isPreferred: true
};

export default config;
