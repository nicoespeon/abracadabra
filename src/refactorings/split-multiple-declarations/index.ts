import { RefactoringWithActionProviderConfig } from "../../refactorings";
import {
  createVisitor,
  splitMultipleDeclarations
} from "./split-multiple-declarations";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "splitMultipleDeclarations",
    operation: splitMultipleDeclarations,
    title: "Split Multiple Declarations"
  },
  actionProvider: {
    message: "Split multiple declarations",
    createVisitor
  }
};

export default config;
