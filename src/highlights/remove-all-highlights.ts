import { RefactoringConfig__DEPRECATED } from "../refactorings";

const config: RefactoringConfig__DEPRECATED = {
  command: {
    key: "removeAllHighlights",
    operation: async (editor) => editor.removeAllHighlights()
  }
};

export default config;
