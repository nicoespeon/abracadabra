import { RefactoringWithActionProviderConfig } from "../../refactorings";
import {
  createVisitor,
  moveLastStatementOutOfIfElse
} from "./move-last-statement-out-of-if-else";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "moveLastStatementOutOfIfElse",
    operation: moveLastStatementOutOfIfElse,
    title: "Move Last Statement Out Of If/Else"
  },
  actionProvider: {
    message: "Move last statement out of if/else",
    createVisitor
  }
};

export default config;
