import { moveToExistingFile, createVisitor } from "./move-to-existing-file";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "moveToExistingFile",
    operation: moveToExistingFile,
    title: "Move to Existing File"
  },
  actionProvider: {
    message: "Move to an existing file",
    createVisitor
  }
};

export default config;
