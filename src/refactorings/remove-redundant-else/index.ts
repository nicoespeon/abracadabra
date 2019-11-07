import { commandKey } from "./command";
import { hasRedundantElse } from "./remove-redundant-else";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey,
  title: "Remove Redundant Else",
  actionProviderMessage: "Remove redundant else",
  canPerformRefactoring: hasRedundantElse,
  isPreferred: true
};

export default config;
