import {
  convertIfElseToTernary,
  createVisitor
} from "./convert-if-else-to-ternary";
import { RefactoringWithActionProviderConfig } from "../../refactorings";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "convertIfElseToTernary",
    operation: convertIfElseToTernary,
    title: "Convert If/Else to Ternary"
  },
  actionProvider: {
    message: "Convert if/else to ternary",
    createVisitor
  }
};

export default config;
