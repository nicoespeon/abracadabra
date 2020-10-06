import {
  extractClass,
  createVisitor
} from "./extract-class";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "extractClass",
    operation: extractClass,
    title: "Extract Class"
  },
  actionProvider: {
    message: "Extract class",
    createVisitor
  }
};

export default config;
