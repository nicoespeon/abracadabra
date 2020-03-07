import {
  removeBracesFromIfStatement,
  hasIfStatementWithBraces
} from "./remove-braces-from-if-statement";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "removeBracesFromIfStatement",
    operation: removeBracesFromIfStatement,
    title: "Remove Braces from If Statement"
  },
  actionProvider: {
    message: "Remove braces from if statement",
    canPerform: hasIfStatementWithBraces
  }
};

export default config;
