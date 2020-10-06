import { extractClass, createVisitor } from "./extract-class";
import { RefactoringWithActionProvider } from "../../types";
import { EXTRACT_CLASS_COMMAND } from "./EXTRACT_CLASS_COMMAND";

const config: RefactoringWithActionProvider = {
  command: {
    key: EXTRACT_CLASS_COMMAND,
    operation: extractClass,
    title: "Extract Class"
  },
  actionProvider: {
    message: "Extract class",
    createVisitor
  }
};

export default config;
