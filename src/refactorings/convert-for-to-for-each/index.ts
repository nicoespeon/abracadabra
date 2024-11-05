import { RefactoringWithActionProviderConfig__DEPRECATED } from "../../refactorings";
import { convertForToForEach, createVisitor } from "./convert-for-to-for-each";

const config: RefactoringWithActionProviderConfig__DEPRECATED = {
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
