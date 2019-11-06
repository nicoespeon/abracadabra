import { commandKey } from "./command";
import { hasTernaryToFlip } from "./flip-ternary";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey,
  title: "Flip Ternary",
  actionProviderMessage: "Flip ternary",
  canPerformRefactoring: hasTernaryToFlip,
  isPreferred: true
};

export default config;
