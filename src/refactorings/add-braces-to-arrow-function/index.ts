import {
  addBracesToArrowFunction,
  hasArrowFunctionToAddBracesVisitorFactory
} from "./add-braces-to-arrow-function";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "addBracesToArrowFunction",
    operation: addBracesToArrowFunction,
    title: "Add Braces to Arrow Function"
  },
  actionProvider: {
    message: "Add braces to arrow function",
    canPerformVisitorFactory: hasArrowFunctionToAddBracesVisitorFactory
  }
};

export default config;
