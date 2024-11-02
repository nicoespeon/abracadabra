import { extractGenericType, createVisitor } from "./extract-generic-type";

import { RefactoringWithActionProviderConfig } from "../../refactorings";

const config: RefactoringWithActionProviderConfig = {
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
