import {
  createVisitor,
  convertTernaryToIfElse
} from "./convert-ternary-to-if-else";

import { RefactoringWithActionProviderConfig } from "../../refactorings";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "convertTernaryToIfElse",
    operation: convertTernaryToIfElse,
    title: "Convert Ternary To If/Else"
  },
  actionProvider: {
    message: "Convert ternary to if/else",
    createVisitor
  }
};

export default config;
