import { addNumericSeparator, createVisitor } from "./add-numeric-separator";

import { RefactoringWithActionProvider } from "../../refactorings";

const config: RefactoringWithActionProvider = {
  command: {
    key: "addNumericSeparator",
    operation: addNumericSeparator,
    title: "Add Numeric Separator"
  },
  actionProvider: {
    message: "Add numeric separator",
    createVisitor
  }
};

export default config;
