import { RefactoringWithActionProviderConfig } from "../../refactorings";
import {
  createVisitor,
  splitDeclarationAndInitialization
} from "./split-declaration-and-initialization";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "splitDeclarationAndInitialization",
    operation: splitDeclarationAndInitialization,
    title: "Split Declaration and Initialization"
  },
  actionProvider: {
    message: "Split declaration and initialization",
    createVisitor
  }
};

export default config;
