import { RefactoringWithActionProviderConfig__DEPRECATED } from "../../refactorings";
import { createVisitor, flipIfElse } from "./flip-if-else";

const config: RefactoringWithActionProviderConfig__DEPRECATED = {
  command: {
    key: "flipIfElse",
    operation: flipIfElse,
    title: "Flip If/Else"
  },
  actionProvider: {
    message: "Flip if/else",
    createVisitor,
    isPreferred: true
  }
};

export default config;
