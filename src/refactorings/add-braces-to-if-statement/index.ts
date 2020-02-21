import {
  addBracesToIfStatement,
  hasIfStatementToAddBraces
} from "./add-braces-to-if-statement";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
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
