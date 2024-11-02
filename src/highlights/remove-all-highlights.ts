import { Refactoring } from "../refactorings";

const config: Refactoring = {
  command: {
    key: "removeAllHighlights",
    operation: async (editor) => editor.removeAllHighlights()
  }
};

export default config;
