import {
  canSplitDeclarationAndInitialization,
  splitDeclarationAndInitialization
} from "./split-declaration-and-initialization";

import { DeprecatedRefactoringWithActionProvider } from "../../types";

const config: DeprecatedRefactoringWithActionProvider = {
  command: {
    key: "splitDeclarationAndInitialization",
    operation: splitDeclarationAndInitialization,
    title: "Split Declaration and Initialization"
  },
  actionProvider: {
    message: "Split declaration and initialization",
    createVisitor: canSplitDeclarationAndInitialization
  }
};

export default config;
