import {
  removeBracesFromJsxAttribute,
  hasBracesToRemoveFromJsxAttribute
} from "./remove-braces-from-jsx-attribute";

import { DeprecatedRefactoringWithActionProvider } from "../../../types";

const config: DeprecatedRefactoringWithActionProvider = {
  command: {
    key: "removeBracesFromJsxAttribute",
    operation: removeBracesFromJsxAttribute,
    title: "Remove Braces from JSX Attribute"
  },
  actionProvider: {
    message: "Remove braces from JSX attribute",
    createVisitor: hasBracesToRemoveFromJsxAttribute
  }
};

export default config;
