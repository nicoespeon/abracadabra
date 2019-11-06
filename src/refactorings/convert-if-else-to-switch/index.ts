import { commandKey } from "./command";
import { hasIfElseToConvert } from "./convert-if-else-to-switch";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey,
  title: "Convert If/Else to Switch",
  actionProviderMessage: "Convert if/else to switch",
  canPerformRefactoring: hasIfElseToConvert,
  isPreferred: true
};

export default config;
