import { RefactoringWithActionProviderConfig } from "../../refactorings";
import {
  createFactoryForConstructor,
  createVisitor
} from "./create-factory-for-constructor";

const config: RefactoringWithActionProviderConfig = {
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
