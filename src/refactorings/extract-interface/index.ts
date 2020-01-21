import { extractInterface, canExtractInterface } from "./extract-interface";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "extractInterface",
    operation: extractInterface,
    title: "Extract Interface"
  },
  actionProvider: {
    message: "Extract interface",
    canPerform: canExtractInterface
  }
};

export default config;
