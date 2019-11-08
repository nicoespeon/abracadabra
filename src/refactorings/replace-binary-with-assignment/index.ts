import {
  tryToReplaceBinaryWithAssignment,
  replaceBinaryWithAssignment
} from "./replace-binary-with-assignment";

import { Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey: "replaceBinaryWithAssignment",
  operation: replaceBinaryWithAssignment,
  title: "Replace Binary With Assignment",
  actionProviderMessage: "Replace binary with assignment",
  isPreferred: true,

  canPerformRefactoring(code: Code, selection: Selection) {
    const attempt = tryToReplaceBinaryWithAssignment(code, selection);
    this.actionProviderMessage = `Replace = with ${attempt.operator}=`;

    return attempt.canReplace;
  }
};

export default config;
