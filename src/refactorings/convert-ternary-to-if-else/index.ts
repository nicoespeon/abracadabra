import {
  hasTernaryToConvert,
  convertTernaryToIfElse
} from "./convert-ternary-to-if-else";

import { DeprecatedRefactoringWithActionProvider } from "../../types";

const config: DeprecatedRefactoringWithActionProvider = {
  command: {
    key: "convertTernaryToIfElse",
    operation: convertTernaryToIfElse,
    title: "Convert Ternary To If/Else"
  },
  actionProvider: {
    message: "Convert ternary to if/else",
    createVisitor: hasTernaryToConvert
  }
};

export default config;
