import { createClass, createVisitor } from "./create-class";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "createClass",
    operation: createClass,
    title: "Create Class"
  },
  actionProvider: {
    message: "Create class",
    createVisitor
  }
};

export default config;
