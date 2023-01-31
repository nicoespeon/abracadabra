import { Refactoring } from "../../types";
import { refreshHighlights } from "./refresh-highlights";

const config: Refactoring = {
  command: {
    key: "refreshHighlights",
    operation: refreshHighlights
  }
};

export default config;
