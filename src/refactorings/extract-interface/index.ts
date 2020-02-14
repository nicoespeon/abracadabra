import {
  extractInterface,
  canExtractInterfaceVisitorFactory
} from "./extract-interface";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "extractInterface",
    operation: extractInterface,
    title: "Extract Interface"
  },
  actionProvider: {
    message: "Extract interface",
    canPerformVisitorFactory: canExtractInterfaceVisitorFactory
  }
};

export default config;
