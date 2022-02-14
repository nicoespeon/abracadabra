import {
  createVisitor,
  mergeWithPreviousIfStatement
} from "./merge-with-previous-if-statement";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
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
