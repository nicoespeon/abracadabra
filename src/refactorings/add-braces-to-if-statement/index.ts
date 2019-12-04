import {
  addBracesToIfStatement,
  hasIfStatementToAddBraces
} from "./add-braces-to-if-statement";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "addBracesToIfStatement",
    operation: addBracesToIfStatement,
    title: "Add Braces To If Statement"
  },
  actionProvider: {
    message: "Add braces to if statement",
    canPerform: hasIfStatementToAddBraces
  }
};

export default config;
