import {
  wrapInFunctionCall,
  createVisitor
} from "./wrap-in-function-call";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "wrapInFunctionCall",
    operation: wrapInFunctionCall,
    title: "Wrap In Function Call"
  },
  actionProvider: {
    message: "Wrap in function call",
    createVisitor
  }
};

export default config;
