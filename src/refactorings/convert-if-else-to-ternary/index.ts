import {
  hasIfElseToConvert,
  convertIfElseToTernary
} from "./convert-if-else-to-ternary";

import { DeprecatedRefactoringWithActionProvider } from "../../types";

const config: DeprecatedRefactoringWithActionProvider = {
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
