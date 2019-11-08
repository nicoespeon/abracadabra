import {
  hasBracesToRemoveFromArrowFunction,
  removeBracesFromArrowFunction
} from "./remove-braces-from-arrow-function";

import { xxxnew_RefactoringWithActionProvider } from "../../types";

const config: xxxnew_RefactoringWithActionProvider = {
  command: {
    key: "removeBracesFromArrowFunction",
    operation: removeBracesFromArrowFunction,
    title: "Remove Braces from Arrow Function"
  },
  actionProvider: {
    message: "Remove braces from arrow function",
    canPerform: hasBracesToRemoveFromArrowFunction
  }
};

export default config;
