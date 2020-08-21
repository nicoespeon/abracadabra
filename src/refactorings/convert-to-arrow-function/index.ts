import {
  convertToArrowFunction,
  createVisitor
} from "./convert-to-arrow-function";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "convertFunctionDeclarationToArrowFunction",
    operation: convertToArrowFunction,
    title: "Convert to Arrow Function"
  },
  actionProvider: {
    message: "Convert to arrow function",
    createVisitor
  }
};

export default config;
