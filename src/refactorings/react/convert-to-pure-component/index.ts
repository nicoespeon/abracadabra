import {
  convertToPureComponent,
  canConvertToPureComponent
} from "./convert-to-pure-component";

import { RefactoringWithActionProvider } from "../../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "react.convertToPureComponent",
    operation: convertToPureComponent,
    title: "(React) Convert To Pure Component"
  },
  actionProvider: {
    message: "Convert to pure component",
    canPerform: canConvertToPureComponent
  }
};

export default config;
