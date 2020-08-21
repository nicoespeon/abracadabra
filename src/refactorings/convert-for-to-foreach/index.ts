import {
  canConvertForLoop,
  convertForToForeach
} from "./convert-for-to-foreach";

import { DeprecatedRefactoringWithActionProvider } from "../../types";

const config: DeprecatedRefactoringWithActionProvider = {
  command: {
    key: "convertForToForeach",
    operation: convertForToForeach,
    title: "Convert For-Loop to ForEach"
  },
  actionProvider: {
    message: "Convert to forEach",
    createVisitor: canConvertForLoop,
    isPreferred: true
  }
};

export default config;
