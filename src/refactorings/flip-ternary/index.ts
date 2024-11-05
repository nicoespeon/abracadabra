import { RefactoringWithActionProviderConfig__DEPRECATED } from "../../refactorings";
import { createVisitor, flipTernary } from "./flip-ternary";

const config: RefactoringWithActionProviderConfig__DEPRECATED = {
  command: {
    key: "flipTernary",
    operation: flipTernary,
    title: "Flip Ternary"
  },
  actionProvider: {
    message: "Flip ternary",
    createVisitor,
    isPreferred: true
  }
};

export default config;
