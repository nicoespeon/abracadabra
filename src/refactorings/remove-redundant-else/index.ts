import { RefactoringWithActionProviderConfig } from "../../refactorings";
import { createVisitor, removeRedundantElse } from "./remove-redundant-else";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "removeRedundantElse",
    operation: removeRedundantElse,
    title: "Remove Redundant Else"
  },
  actionProvider: {
    message: "Remove redundant else",
    createVisitor,
    isPreferred: true
  }
};

export default config;
