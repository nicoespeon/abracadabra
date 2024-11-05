import { RefactoringConfig__DEPRECATED } from "../../refactorings";
import { toggleHighlight } from "./toggle-highlight";

const config: RefactoringConfig__DEPRECATED = {
  command: {
    key: "toggleHighlight",
    operation: toggleHighlight
  }
};

export default config;
