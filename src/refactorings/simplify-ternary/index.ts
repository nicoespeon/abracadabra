import { RefactoringWithActionProviderConfig } from "../../refactorings";
import { createVisitor, simplifyTernary } from "./simplify-ternary";

const config: RefactoringWithActionProviderConfig = {
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
