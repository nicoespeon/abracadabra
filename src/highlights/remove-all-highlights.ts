import { Refactoring } from "../types";

const config: Refactoring = {
  command: {
    key: "removeAllHighlights",
    operation: async (editor) => editor.removeAllHighlights()
  }
};

export default config;
