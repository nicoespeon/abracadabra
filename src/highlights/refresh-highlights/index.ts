import { RefactoringConfig } from "../../refactorings";
import { refreshHighlights } from "./refresh-highlights";

const config: RefactoringConfig = {
  command: {
    key: "refreshHighlights",
    operation: refreshHighlights
  }
};

export default config;
