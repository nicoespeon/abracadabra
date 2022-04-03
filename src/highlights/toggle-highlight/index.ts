import { Refactoring } from "../../types";
import { toggleHighlight } from "./toggle-highlight";

const config: Refactoring = {
  command: {
    key: "toggleHighlight",
    operation: toggleHighlight
  }
};

export default config;
