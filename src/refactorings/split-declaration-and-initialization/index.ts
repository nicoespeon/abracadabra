import {
  canSplitDeclarationAndInitialization,
  splitDeclarationAndInitialization
} from "./split-declaration-and-initialization";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey: "splitDeclarationAndInitialization",
  operation: splitDeclarationAndInitialization,
  title: "Split Declaration and Initialization",
  actionProviderMessage: "Split declaration and initialization",
  canPerformRefactoring: canSplitDeclarationAndInitialization
};

export default config;
