import { RefactoringWithActionProviderConfig__DEPRECATED } from "../../refactorings";
import { createVisitor, removeJsxFragment } from "./remove-jsx-fragment";

const config: RefactoringWithActionProviderConfig__DEPRECATED = {
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
