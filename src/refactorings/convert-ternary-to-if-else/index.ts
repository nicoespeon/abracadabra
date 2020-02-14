import {
  hasTernaryToConvertVisitorFactory,
  convertTernaryToIfElse
} from "./convert-ternary-to-if-else";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "convertTernaryToIfElse",
    operation: convertTernaryToIfElse,
    title: "Convert Ternary To If/Else"
  },
  actionProvider: {
    message: "Convert ternary to if/else",
    canPerformVisitorFactory: hasTernaryToConvertVisitorFactory
  }
};

export default config;
