import { RefactoringWithActionProviderConfig } from "../../refactorings";
import {
  convertTernaryToIfElse,
  createVisitor
} from "./convert-ternary-to-if-else";

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
