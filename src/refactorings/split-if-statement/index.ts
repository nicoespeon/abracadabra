import { commandKey } from "./command";
import { canSplitIfStatement } from "./split-if-statement";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey,
  title: "Split If Statement",
  actionProviderMessage: "Split if statement",
  canPerformRefactoring: canSplitIfStatement
};

export default config;
