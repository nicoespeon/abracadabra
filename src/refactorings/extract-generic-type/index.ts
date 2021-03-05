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
    createVisitor: (selection, onMatch) =>
      createVisitor(selection, (occurrence) => onMatch(occurrence.path))
  }
};

export default config;
