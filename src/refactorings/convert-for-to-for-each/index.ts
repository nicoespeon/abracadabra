import { createVisitor, convertForToForEach } from "./convert-for-to-for-each";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "convertForToForEach",
    operation: convertForToForEach,
    title: "Convert For-Loop to ForEach"
  },
  actionProvider: {
    message: "Convert to forEach",
    createVisitor,
    isPreferred: true
  }
};

export default config;
