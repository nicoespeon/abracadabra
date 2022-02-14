import { simplifyTernary, createVisitor } from "./simplify-ternary";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
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
