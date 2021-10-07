import { RefactoringWithActionProvider } from "../../types";
import {
  convertForEachToForOf,
  createVisitor
} from "./convert-for-each-to-for-of";

const config: RefactoringWithActionProvider = {
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
