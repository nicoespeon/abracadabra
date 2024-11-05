import { RefactoringWithActionProviderConfig__DEPRECATED } from "../../refactorings";
import {
  convertForEachToForOf,
  createVisitor
} from "./convert-for-each-to-for-of";

const config: RefactoringWithActionProviderConfig__DEPRECATED = {
  command: {
    key: "convertForEachToForOf",
    operation: convertForEachToForOf,
    title: "Convert ForEach to For-Of"
  },
  actionProvider: {
    message: "Convert forEach to for-of",
    createVisitor
  }
};

export default config;
