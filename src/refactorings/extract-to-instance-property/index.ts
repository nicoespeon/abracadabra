import { RefactoringWithActionProviderConfig } from "../../refactorings";
import {
  createVisitor,
  extractToInstanceProperty
} from "./extract-to-instance-property";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "extractToInstanceProperty",
    operation: extractToInstanceProperty,
    title: "Extract to Instance Property"
  },
  actionProvider: {
    message: "Extract to instance property",
    createVisitor
  }
};

export default config;
