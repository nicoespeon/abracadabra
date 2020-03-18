import {
  simplifyTernary,
  createTernaryToSimplifyVisitor
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
    createVisitor: createTernaryToSimplifyVisitor
  }
};

export default config;
