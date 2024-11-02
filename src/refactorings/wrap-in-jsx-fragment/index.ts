import { RefactoringWithActionProviderConfig } from "../../refactorings";
import { createVisitor, wrapInJsxFragment } from "./wrap-in-jsx-fragment";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "wrapInJsxFragment",
    operation: wrapInJsxFragment,
    title: "Wrap In JSX Fragment"
  },
  actionProvider: {
    message: "Wrap in JSX Fragment",
    createVisitor
  }
};

export default config;
