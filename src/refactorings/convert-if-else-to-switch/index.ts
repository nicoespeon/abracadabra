import {
  createVisitor,
  convertIfElseToSwitch
} from "./convert-if-else-to-switch";

import { RefactoringWithActionProvider } from "../../refactorings";

const config: RefactoringWithActionProvider = {
  command: {
    key: "convertIfElseToSwitch",
    operation: convertIfElseToSwitch,
    title: "Convert If/Else to Switch"
  },
  actionProvider: {
    message: "Convert if/else to switch",
    createVisitor,
    isPreferred: true
  }
};

export default config;
