import { RefactoringWithActionProvider } from "../../types";
import { createVisitor, wrapInJsxFragment } from "./wrap-in-jsx-fragment";

const config: RefactoringWithActionProvider = {
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
