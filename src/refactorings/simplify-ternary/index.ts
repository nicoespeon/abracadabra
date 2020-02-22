import { simplifyTernary, canSimplifyTernary } from "./simplify-ternary";
import * as t from "../../ast";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "simplifyTernary",
    operation: simplifyTernary,
    title: "Simplify Ternary"
  },
  actionProvider: {
    message: "Simplify ternary",
    createVisitor: canSimplifyTernary,
    updateMessage(path: t.NodePath): string {
      return `Simplify ternary (for demo purposes only: ${path.node.type})`;
    }
  }
};

export default config;
