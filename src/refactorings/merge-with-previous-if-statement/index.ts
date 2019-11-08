import {
  canMergeWithPreviousIf,
  mergeWithPreviousIfStatement
} from "./merge-with-previous-if-statement";

import { xxxnew_RefactoringWithActionProvider } from "../../types";

const config: xxxnew_RefactoringWithActionProvider = {
  command: {
    key: "mergeWithPreviousIfStatement",
    operation: mergeWithPreviousIfStatement,
    title: "Merge With Previous If Statement"
  },
  actionProvider: {
    message: "Merge with previous if",
    canPerform: canMergeWithPreviousIf,
    isPreferred: true
  }
};

export default config;
