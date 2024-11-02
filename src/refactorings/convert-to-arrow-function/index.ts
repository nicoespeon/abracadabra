import {
  convertToArrowFunction,
  createVisitor
} from "./convert-to-arrow-function";
import { RefactoringWithActionProviderConfig } from "../../refactorings";

const config: RefactoringWithActionProviderConfig = {
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
