import { hasRedundantElse, removeRedundantElse } from "./remove-redundant-else";

import { xxxnew_RefactoringWithActionProvider } from "../../types";

const config: xxxnew_RefactoringWithActionProvider = {
  command: {
    key: "removeRedundantElse",
    operation: removeRedundantElse,
    title: "Remove Redundant Else"
  },
  actionProvider: {
    message: "Remove redundant else",
    canPerform: hasRedundantElse,
    isPreferred: true
  }
};

export default config;
