import { RefactoringWithActionProviderConfig__DEPRECATED } from "../../refactorings";
import { changeSignature, createVisitor } from "./change-signature";

const config: RefactoringWithActionProviderConfig__DEPRECATED = {
  command: {
    key: "changeSignature",
    operation: changeSignature,
    title: "Change Signature"
  },
  actionProvider: {
    message: "Change signature",
    createVisitor
  }
};

export default config;
