import { RefactoringWithActionProviderConfig__DEPRECATED } from "../../refactorings";
import { createVisitor, toggleBraces } from "./toggle-braces";

const config: RefactoringWithActionProviderConfig__DEPRECATED = {
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

      if (path.isLoop()) {
        return "Toggle braces (loop)";
      }

      if (path.isArrowFunctionExpression()) {
        return "Toggle braces (arrow function)";
      }

      if (path.isJSXAttribute()) {
        return "Toggle braces (JSX attribute)";
      }

      return "Toggle braces";
    }
  }
};

export default config;
