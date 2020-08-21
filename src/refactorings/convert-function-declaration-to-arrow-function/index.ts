import {
  convertFunctionDeclarationToArrowFunction,
  createVisitor
} from "./convert-function-declaration-to-arrow-function";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "convertFunctionDeclarationToArrowFunction",
    operation: convertFunctionDeclarationToArrowFunction,
    title: "Convert to Arrow Function"
  },
  actionProvider: {
    message: "Convert to arrow function",
    createVisitor
  }
};

export default config;
