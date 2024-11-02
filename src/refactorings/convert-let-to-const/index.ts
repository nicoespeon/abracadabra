import { RefactoringWithActionProviderConfig } from "../../refactorings";
import { convertLetToConst, createVisitor } from "./convert-let-to-const";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "convertLetToConst",
    operation: convertLetToConst,
    title: "Convert let to const"
  },
  actionProvider: {
    message: "Convert let to const",
    createVisitor
  }
};

export default config;
