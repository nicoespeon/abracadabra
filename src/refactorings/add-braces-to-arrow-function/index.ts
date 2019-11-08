import {
  addBracesToArrowFunction,
  hasArrowFunctionToAddBraces
} from "./add-braces-to-arrow-function";

import { xxxnew_RefactoringWithActionProvider } from "../../types";

const config: xxxnew_RefactoringWithActionProvider = {
  command: {
    key: "addBracesToArrowFunction",
    operation: addBracesToArrowFunction,
    title: "Add Braces to Arrow Function"
  },
  actionProvider: {
    message: "Add braces to arrow function",
    canPerform: hasArrowFunctionToAddBraces
  }
};

export default config;
