import { convertToPureComponent } from "./convert-to-pure-component";

import { Refactoring } from "../../../types";

const config: Refactoring = {
  command: {
    key: "react.convertToPureComponent",
    operation: convertToPureComponent
  }
};

export default config;
