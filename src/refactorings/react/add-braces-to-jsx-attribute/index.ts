import {
  addBracesToJsxAttribute,
  hasJsxAttributeToAddBracesToVisitorFactory
} from "./add-braces-to-jsx-attribute";

import { RefactoringWithActionProvider } from "../../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "addBracesToJsxAttribute",
    operation: addBracesToJsxAttribute,
    title: "Add Braces to JSX Attribute"
  },
  actionProvider: {
    message: "Add braces to JSX attribute",
    canPerformVisitorFactory: hasJsxAttributeToAddBracesToVisitorFactory
  }
};

export default config;
