import { RefactoringConfig } from "../../refactorings";
import { toggleHighlight } from "./toggle-highlight";

const config: RefactoringConfig = {
  command: {
    key: "toggleHighlight",
    operation: toggleHighlight
  }
};

export default config;
