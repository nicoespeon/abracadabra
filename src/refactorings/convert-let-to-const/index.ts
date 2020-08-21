import { convertLetToConst, createVisitor } from "./convert-let-to-const";

import { DeprecatedRefactoringWithActionProvider } from "../../types";

const config: DeprecatedRefactoringWithActionProvider = {
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
