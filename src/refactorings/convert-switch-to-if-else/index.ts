import {
  convertSwitchToIfElse,
  createVisitor
} from "./convert-switch-to-if-else";
import { RefactoringWithActionProviderConfig } from "../../refactorings";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "convertSwitchToIfElse",
    operation: convertSwitchToIfElse,
    title: "Convert Switch to If/Else"
  },
  actionProvider: {
    message: "Convert switch to if/else",
    createVisitor,
    isPreferred: true
  }
};

export default config;
