import {
  removeBracesFromJsxAttribute,
  hasBracesToRemoveFromJsxAttributeVisitorFactory
} from "./remove-braces-from-jsx-attribute";

import { RefactoringWithActionProvider } from "../../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "removeBracesFromJsxAttribute",
    operation: removeBracesFromJsxAttribute,
    title: "Remove Braces from JSX Attribute"
  },
  actionProvider: {
    message: "Remove braces from JSX attribute",
    canPerformVisitorFactory: hasBracesToRemoveFromJsxAttributeVisitorFactory
  }
};

export default config;
