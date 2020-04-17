import { extractGenericType, createVisitor } from "./extract-generic-type";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "extractGenericType",
    operation: extractGenericType,
    title: "Extract Generic Type"
  },
  actionProvider: {
    message: "Extract generic type",
    createVisitor
  }
};

export default config;
