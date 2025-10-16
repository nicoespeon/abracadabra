import { RefactoringWithActionProviderConfig } from "../../refactorings";
import { createVisitor, flipTernary } from "./flip-ternary";

const config: RefactoringWithActionProviderConfig = {
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
