import { RefactoringConfig__DEPRECATED } from "../../refactorings";
import { refreshHighlights } from "./refresh-highlights";

const config: RefactoringConfig__DEPRECATED = {
  command: {
    key: "refreshHighlights",
    operation: refreshHighlights
  }
};

export default config;
