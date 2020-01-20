import {
  removeBracesFromJsxAttribute,
  hasBracesToRemoveFromJsxAttribute
} from "./remove-braces-from-jsx-attribute";

import { RefactoringWithActionProvider } from "../../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "removeBracesFromJsxAttribute",
    operation: removeBracesFromJsxAttribute,
    title: "Remove Braces From Jsx Attribute"
  },
  actionProvider: {
    message: "Remove braces from jsx attribute",
    canPerform: hasBracesToRemoveFromJsxAttribute
  }
};

export default config;
