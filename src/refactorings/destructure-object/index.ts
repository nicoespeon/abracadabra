import { destructureObject, createVisitor } from "./destructure-object";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "destructureObject",
    operation: destructureObject,
    title: "Destructure Object"
  },
  actionProvider: {
    message: "Destructure object",
    createVisitor
  }
};

export default config;
