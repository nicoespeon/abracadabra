import {
  hasIfElseToConvert,
  convertIfElseToTernary
} from "./convert-if-else-to-ternary";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "convertIfElseToTernary",
    operation: convertIfElseToTernary,
    title: "Convert If/Else to Ternary"
  },
  actionProvider: {
    message: "Convert if/else to ternary",
    createVisitor: hasIfElseToConvert
  }
};

export default config;
