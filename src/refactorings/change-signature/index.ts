import { changeSignature, createVisitor } from "./change-signature";

import { RefactoringWithActionProvider } from "../../refactorings";

const config: RefactoringWithActionProvider = {
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
