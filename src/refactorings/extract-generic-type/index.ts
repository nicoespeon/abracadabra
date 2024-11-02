import { RefactoringWithActionProviderConfig } from "../../refactorings";
import { createVisitor, extractGenericType } from "./extract-generic-type";

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
