import { toggleBraces, createVisitor } from "./toggle-braces";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "toggleBraces",
    operation: toggleBraces,
    title: "Toggle Braces"
  },
  actionProvider: {
    message: "Toggle braces",
    createVisitor,
    updateMessage(path) {
      if (path.isIfStatement()) {
        return "Toggle braces (if statement)";
      }

      if (path.isArrowFunctionExpression()) {
        return "Toggle braces (arrow function)";
      }

      if (path.isJSXAttribute()) {
        return "Toggle braces (JSX attributes)";
      }

      return "Toggle braces";
    }
  }
};

export default config;
