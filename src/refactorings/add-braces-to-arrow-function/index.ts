import { commandKey } from "./command";
import { hasArrowFunctionToAddBraces } from "./add-braces-to-arrow-function";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey,
  title: "Add Braces to Arrow Function",
  actionProviderMessage: "Add braces to arrow function",
  canPerformRefactoring: hasArrowFunctionToAddBraces
};

export default config;
