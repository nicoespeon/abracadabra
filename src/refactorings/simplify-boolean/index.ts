import { RefactoringWithActionProviderConfig__DEPRECATED } from "../../refactorings";
import { createVisitor, simplifyBoolean } from "./simplify-boolean";

const config: RefactoringWithActionProviderConfig__DEPRECATED = {
  command: {
    key: "simplifyBoolean",
    operation: simplifyBoolean,
    title: "Simplify Boolean"
  },
  actionProvider: {
    message: "Simplify boolean",
    createVisitor
  }
};

export default config;
