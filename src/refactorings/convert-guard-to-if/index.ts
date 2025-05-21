import { RefactoringWithActionProviderConfig } from "../../refactorings";
import { convertGuardToIf, createVisitor } from "./convert-guard-to-if";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "convertGuardToIf",
    operation: convertGuardToIf,
    title: "Convert Guard To If"
  },
  actionProvider: {
    message: "Convert guard to if",
    createVisitor
  }
};

export default config;
