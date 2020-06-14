import { convertLetToConst, createVisitor } from "./convert-let-to-const";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "convertLetToConst",
    operation: convertLetToConst,
    title: "Convert Let to Const"
  },
  actionProvider: {
    message: "Convert Let to Const",
    createVisitor
  }
};

export default config;
