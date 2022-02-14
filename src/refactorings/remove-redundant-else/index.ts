import { createVisitor, removeRedundantElse } from "./remove-redundant-else";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "removeRedundantElse",
    operation: removeRedundantElse,
    title: "Remove Redundant Else"
  },
  actionProvider: {
    message: "Remove redundant else",
    createVisitor,
    isPreferred: true
  }
};

export default config;
