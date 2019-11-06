import { commandKey } from "./command";
import { hasIfElseToConvert } from "./convert-if-else-to-ternary";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey,
  actionProviderMessage: "Convert if/else to ternary",
  title: "Convert If/Else to Ternary",
  canPerformRefactoring: hasIfElseToConvert
};

export default config;
