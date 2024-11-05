import { RefactoringWithActionProviderConfig__DEPRECATED } from "../../refactorings";
import {
  convertToArrowFunction,
  createVisitor
} from "./convert-to-arrow-function";

const config: RefactoringWithActionProviderConfig__DEPRECATED = {
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
