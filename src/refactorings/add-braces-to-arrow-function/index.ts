import {
  addBracesToArrowFunction,
  hasArrowFunctionToAddBraces
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
    createVisitor: hasArrowFunctionToAddBraces
  }
};

export default config;
