import { convertToPureComponent } from "./convert-to-pure-component";

import { DeprecatedRefactoring } from "../../../types";

const config: DeprecatedRefactoring = {
  command: {
    key: "react.convertToPureComponent",
    operation: convertToPureComponent
  }
};

export default config;
