import {
  EditorCommand,
  RefactoringConfig,
  RefactoringState
} from "../../refactorings";
import { extractType } from "./extract-type/extract-type";
import { extractVariable } from "./extract-variable/extract-variable";

const config: RefactoringConfig = {
  command: {
    key: "extract",
    operation: extract
  }
};

export default config;

function extract(state: RefactoringState): EditorCommand {
  const result = extractType(state);
  return result.action === "show error" ? extractVariable(state) : result;
}
