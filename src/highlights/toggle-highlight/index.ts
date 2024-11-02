import { Refactoring } from "../../refactorings";
import { toggleHighlight } from "./toggle-highlight";

const config: Refactoring = {
  command: {
    key: "toggleHighlight",
    operation: toggleHighlight
  }
};

export default config;
