import { removeJsxFragment } from "./remove-jsx-fragment";

import { Refactoring } from "../../types";

const config: Refactoring = {
  command: {
    key: "removeJsxFragment",
    operation: removeJsxFragment
  }
};

export default config;
