import { simplifyBoolean, createVisitor } from "./simplify-boolean";

import { RefactoringWithActionProvider } from "../../refactorings";

const config: RefactoringWithActionProvider = {
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
