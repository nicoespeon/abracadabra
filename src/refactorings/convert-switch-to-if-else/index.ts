import {
  convertSwitchToIfElse,
  hasSwitchToConvert
} from "./convert-switch-to-if-else";

import { DeprecatedRefactoringWithActionProvider } from "../../types";

const config: DeprecatedRefactoringWithActionProvider = {
  command: {
    key: "convertSwitchToIfElse",
    operation: convertSwitchToIfElse,
    title: "Convert Switch to If/Else"
  },
  actionProvider: {
    message: "Convert switch to if/else",
    createVisitor: hasSwitchToConvert,
    isPreferred: true
  }
};

export default config;
