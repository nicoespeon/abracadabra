import { commandKey } from "./command";
import { hasIfElseToFlip } from "./flip-if-else";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey,
  title: "Flip If/Else",
  actionProviderMessage: "Flip if/else",
  canPerformRefactoring: hasIfElseToFlip,
  isPreferred: true
};

export default config;
