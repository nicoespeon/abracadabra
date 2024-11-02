import { changeSignature, createVisitor } from "./change-signature";

import { RefactoringWithActionProviderConfig } from "../../refactorings";

const config: RefactoringWithActionProviderConfig = {
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
