import {
  createVisitor,
  mergeWithPreviousIfStatement
} from "./merge-with-previous-if-statement";

import { RefactoringWithActionProviderConfig } from "../../refactorings";

const config: RefactoringWithActionProviderConfig = {
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
