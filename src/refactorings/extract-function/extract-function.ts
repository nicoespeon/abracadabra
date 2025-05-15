import { COMMANDS, EditorCommand, RefactoringState } from "../../refactorings";

export function extractFunction(state: RefactoringState): EditorCommand {
  if (state.state !== "new") {
    return COMMANDS.showErrorDidNotFind("code to be extracted");
  }

  // Editor built-in extraction works fine => ok to delegate the work for now.
  return COMMANDS.delegate("extract function");
}
