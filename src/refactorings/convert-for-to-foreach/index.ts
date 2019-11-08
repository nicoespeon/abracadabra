import {
  canConvertForLoop,
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
    canPerform: canConvertForLoop,
    isPreferred: true
  }
};

export default config;
