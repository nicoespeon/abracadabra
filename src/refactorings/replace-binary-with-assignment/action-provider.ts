import {
  createActionProviderFor,
  RefactoringActionProvider
} from "../../action-providers";

import { commandKey } from "./command";
import { tryToReplaceBinaryWithAssignment } from "./replace-binary-with-assignment";
import { Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";

class ReplaceBinaryWithAssignmentActionProvider extends RefactoringActionProvider {
  commandKey = commandKey;
  title = "Replace Binary With Assignment";
  isPreferred = true;

  canPerformRefactoring(code: Code, selection: Selection) {
    const attempt = tryToReplaceBinaryWithAssignment(code, selection);
    this.actionMessage = `Replace = with ${attempt.operator}=`;

    return attempt.canReplace;
  }
}

export default createActionProviderFor(
  new ReplaceBinaryWithAssignmentActionProvider()
);
