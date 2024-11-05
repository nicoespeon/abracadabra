import { RefactoringWithActionProviderConfig__DEPRECATED } from "../../refactorings";
import { createVisitor, simplifyTernary } from "./simplify-ternary";

const config: RefactoringWithActionProviderConfig__DEPRECATED = {
  command: {
    key: "simplifyTernary",
    operation: simplifyTernary,
    title: "Simplify Ternary"
  },
  actionProvider: {
    message: "Simplify ternary",
    createVisitor
  }
};

export default config;
