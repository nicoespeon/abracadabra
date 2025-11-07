import { COMMANDS, RefactoringConfig } from "../refactorings";

const config: RefactoringConfig = {
  command: {
    key: "removeAllHighlights",
    operation: () => COMMANDS.removeAllHighlights()
  }
};

export default config;
