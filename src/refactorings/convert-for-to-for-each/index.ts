import { RefactoringWithActionProviderConfig } from "../../refactorings";
import { convertForToForEach, createVisitor } from "./convert-for-to-for-each";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "convertForToForEach",
    operation: convertForToForEach,
    title: "Convert For-Loop to ForEach"
  },
  actionProvider: {
    message: "Convert to forEach",
    createVisitor,
    isPreferred: true
  }
};

export default config;
