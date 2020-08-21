import {
  addBracesToIfStatement,
  hasIfStatementToAddBraces
} from "./add-braces-to-if-statement";

import { DeprecatedRefactoringWithActionProvider } from "../../types";

const config: DeprecatedRefactoringWithActionProvider = {
  command: {
    key: "addBracesToIfStatement",
    operation: addBracesToIfStatement,
    title: "Add Braces to If Statement"
  },
  actionProvider: {
    message: "Add braces to if statement",
    createVisitor: hasIfStatementToAddBraces
  }
};

export default config;
