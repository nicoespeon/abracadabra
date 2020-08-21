import {
  removeBracesFromIfStatement,
  hasIfStatementWithBraces
} from "./remove-braces-from-if-statement";

import { DeprecatedRefactoringWithActionProvider } from "../../types";

const config: DeprecatedRefactoringWithActionProvider = {
  command: {
    key: "removeBracesFromIfStatement",
    operation: removeBracesFromIfStatement,
    title: "Remove Braces from If Statement"
  },
  actionProvider: {
    message: "Remove braces from if statement",
    createVisitor: hasIfStatementWithBraces
  }
};

export default config;
