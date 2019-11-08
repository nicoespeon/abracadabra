import { commandKey } from "./command";
import {
  canSplitDeclarationAndInitialization,
  splitDeclarationAndInitialization
} from "./split-declaration-and-initialization";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey,
  operation: splitDeclarationAndInitialization,
  title: "Split Declaration and Initialization",
  actionProviderMessage: "Split declaration and initialization",
  canPerformRefactoring: canSplitDeclarationAndInitialization
};

export default config;
