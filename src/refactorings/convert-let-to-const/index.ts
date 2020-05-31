import { convertLetToConst, createVisitor } from "./convert-let-to-const";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
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
