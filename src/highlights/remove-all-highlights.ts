import { RefactoringConfig } from "../refactorings";

const config: RefactoringConfig = {
  command: {
    key: "removeAllHighlights",
    operation: async (editor) => editor.removeAllHighlights()
  }
};

export default config;
