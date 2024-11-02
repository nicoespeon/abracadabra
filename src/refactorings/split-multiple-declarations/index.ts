import { RefactoringWithActionProviderConfig__NEW } from "../../refactorings";
import {
  createVisitor,
  splitMultipleDeclarations
} from "./split-multiple-declarations";

const config: RefactoringWithActionProviderConfig__NEW = {
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
