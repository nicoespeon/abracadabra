import {
  canMergeWithPreviousIf,
  mergeWithPreviousIfStatement
} from "./merge-with-previous-if-statement";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey: "abracadabra.mergeWithPreviousIfStatement",
  operation: mergeWithPreviousIfStatement,
  title: "Merge With Previous If Statement",
  actionProviderMessage: "Merge with previous if",
  canPerformRefactoring: canMergeWithPreviousIf,
  isPreferred: true
};

export default config;
