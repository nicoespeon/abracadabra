import { RefactoringWithActionProviderConfig__DEPRECATED } from "../../refactorings";
import { createVisitor, removeDeadCode } from "./remove-dead-code";

const config: RefactoringWithActionProviderConfig__DEPRECATED = {
  command: {
    key: "removeDeadCode",
    operation: removeDeadCode,
    title: "Remove Dead Code"
  },
  actionProvider: {
    message: "Remove dead code",
    createVisitor,
    isPreferred: true
  }
};

export default config;
