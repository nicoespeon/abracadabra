import {
  hasIfElseToConvertVisitorFactory,
  convertIfElseToSwitch
} from "./convert-if-else-to-switch";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "convertIfElseToSwitch",
    operation: convertIfElseToSwitch,
    title: "Convert If/Else to Switch"
  },
  actionProvider: {
    message: "Convert if/else to switch",
    canPerformVisitorFactory: hasIfElseToConvertVisitorFactory,
    isPreferred: true
  }
};

export default config;
