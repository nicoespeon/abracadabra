import { createVisitor, removeJsxFragment } from "./remove-jsx-fragment";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "removeJsxFragment",
    operation: removeJsxFragment,
    title: "Remove JSX Fragment"
  },
  actionProvider: {
    message: "Remove JSX Fragment",
    createVisitor
  }
};

export default config;
