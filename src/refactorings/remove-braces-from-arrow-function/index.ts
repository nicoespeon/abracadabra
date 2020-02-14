import {
  hasBracesToRemoveFromArrowFunctionVisitorFactory,
  removeBracesFromArrowFunction
} from "./remove-braces-from-arrow-function";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "removeBracesFromArrowFunction",
    operation: removeBracesFromArrowFunction,
    title: "Remove Braces from Arrow Function"
  },
  actionProvider: {
    message: "Remove braces from arrow function",
    canPerformVisitorFactory: hasBracesToRemoveFromArrowFunctionVisitorFactory
  }
};

export default config;
