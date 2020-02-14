import {
  canConvertForLoopVisitorFactory,
  convertForToForeach
} from "./convert-for-to-foreach";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "convertForToForeach",
    operation: convertForToForeach,
    title: "Convert For-Loop to ForEach"
  },
  actionProvider: {
    message: "Convert to forEach",
    canPerformVisitorFactory: canConvertForLoopVisitorFactory,
    isPreferred: true
  }
};

export default config;
