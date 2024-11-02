import { addNumericSeparator, createVisitor } from "./add-numeric-separator";

import { RefactoringWithActionProviderConfig } from "../../refactorings";

const config: RefactoringWithActionProviderConfig = {
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
