import { RefactoringWithActionProviderConfig__DEPRECATED } from "../../refactorings";
import {
  createVisitor,
  mergeWithPreviousIfStatement
} from "./merge-with-previous-if-statement";

const config: RefactoringWithActionProviderConfig__DEPRECATED = {
  command: {
    key: "mergeWithPreviousIfStatement",
    operation: mergeWithPreviousIfStatement,
    title: "Merge With Previous If Statement"
  },
  actionProvider: {
    message: "Merge with previous if",
    createVisitor,
    isPreferred: true
  }
};

export default config;
