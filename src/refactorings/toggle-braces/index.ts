import {
  toggleBraces,
  createVisitor
} from "./toggle-braces";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "toggleBraces",
    operation: toggleBraces,
    title: "Toggle Braces"
  },
  actionProvider: {
    message: "Toggle braces",
    createVisitor
  }
};

export default config;
