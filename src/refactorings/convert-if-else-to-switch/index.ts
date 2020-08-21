import {
  hasIfElseToConvert,
  convertIfElseToSwitch
} from "./convert-if-else-to-switch";

import { DeprecatedRefactoringWithActionProvider } from "../../types";

const config: DeprecatedRefactoringWithActionProvider = {
  command: {
    key: "convertIfElseToSwitch",
    operation: convertIfElseToSwitch,
    title: "Convert If/Else to Switch"
  },
  actionProvider: {
    message: "Convert if/else to switch",
    createVisitor: hasIfElseToConvert,
    isPreferred: true
  }
};

export default config;
