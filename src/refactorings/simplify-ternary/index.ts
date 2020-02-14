import {
  simplifyTernary,
  hasTernaryToSimplifyVisitorFactory
} from "./simplify-ternary";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "simplifyTernary",
    operation: simplifyTernary,
    title: "Simplify Ternary"
  },
  actionProvider: {
    message: "Simplify ternary",
    canPerformVisitorFactory: hasTernaryToSimplifyVisitorFactory
  }
};

export default config;
