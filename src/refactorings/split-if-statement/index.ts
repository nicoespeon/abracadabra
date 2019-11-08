import { commandKey } from "./command";
import { canSplitIfStatement, splitIfStatement } from "./split-if-statement";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey,
  operation: splitIfStatement,
  title: "Split If Statement",
  actionProviderMessage: "Split if statement",
  canPerformRefactoring: canSplitIfStatement
};

export default config;
