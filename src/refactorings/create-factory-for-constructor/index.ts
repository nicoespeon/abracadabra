import {
  createFactoryForConstructor,
  createVisitor
} from "./create-factory-for-constructor";

import { RefactoringWithActionProvider } from "../../refactorings";

const config: RefactoringWithActionProvider = {
  command: {
    key: "createFactoryForConstructor",
    operation: createFactoryForConstructor,
    title: "Create Factory for Constructor"
  },
  actionProvider: {
    message: "Create factory for constructor",
    createVisitor
  }
};

export default config;
