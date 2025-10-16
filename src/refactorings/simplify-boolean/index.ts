import { RefactoringWithActionProviderConfig } from "../../refactorings";
import { createVisitor, simplifyBoolean } from "./simplify-boolean";

const config: RefactoringWithActionProviderConfig = {
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
