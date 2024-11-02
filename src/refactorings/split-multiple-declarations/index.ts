import {
  splitMultipleDeclarations,
  createVisitor
} from "./split-multiple-declarations";
import { RefactoringWithActionProvider__NEW } from "../../refactorings";

const config: RefactoringWithActionProvider__NEW = {
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
