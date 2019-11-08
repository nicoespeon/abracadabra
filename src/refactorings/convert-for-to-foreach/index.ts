import {
  canConvertForLoop,
  convertForToForeach
} from "./convert-for-to-foreach";

import { xxxnew_RefactoringWithActionProvider } from "../../types";

const config: xxxnew_RefactoringWithActionProvider = {
  command: {
    key: "convertForToForeach",
    operation: convertForToForeach,
    title: "Convert For-Loop to ForEach"
  },
  actionProvider: {
    message: "Convert to forEach",
    canPerform: canConvertForLoop,
    isPreferred: true
  }
};

export default config;
