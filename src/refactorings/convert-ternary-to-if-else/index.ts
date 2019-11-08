import {
  hasTernaryToConvert,
  convertTernaryToIfElse
} from "./convert-ternary-to-if-else";

import { xxxnew_RefactoringWithActionProvider } from "../../types";

const config: xxxnew_RefactoringWithActionProvider = {
  command: {
    key: "convertTernaryToIfElse",
    operation: convertTernaryToIfElse,
    title: "Convert Ternary To If/Else"
  },
  actionProvider: {
    message: "Convert ternary to if/else",
    canPerform: hasTernaryToConvert
  }
};

export default config;
