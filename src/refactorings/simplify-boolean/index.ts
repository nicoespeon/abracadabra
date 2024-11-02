import { simplifyBoolean, createVisitor } from "./simplify-boolean";

import { RefactoringWithActionProviderConfig } from "../../refactorings";

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
