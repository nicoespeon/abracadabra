import {
  hasIfElseToConvert,
  convertIfElseToSwitch
} from "./convert-if-else-to-switch";

import { xxxnew_RefactoringWithActionProvider } from "../../types";

const config: xxxnew_RefactoringWithActionProvider = {
  command: {
    key: "convertIfElseToSwitch",
    operation: convertIfElseToSwitch,
    title: "Convert If/Else to Switch"
  },
  actionProvider: {
    message: "Convert if/else to switch",
    canPerform: hasIfElseToConvert,
    isPreferred: true
  }
};

export default config;
