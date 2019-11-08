import {
  hasIfElseToConvert,
  convertIfElseToTernary
} from "./convert-if-else-to-ternary";

import { xxxnew_RefactoringWithActionProvider } from "../../types";

const config: xxxnew_RefactoringWithActionProvider = {
  command: {
    key: "convertIfElseToTernary",
    operation: convertIfElseToTernary,
    title: "Convert If/Else to Ternary"
  },
  actionProvider: {
    message: "Convert if/else to ternary",
    canPerform: hasIfElseToConvert
  }
};

export default config;
