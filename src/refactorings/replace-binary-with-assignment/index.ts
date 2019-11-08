import {
  tryToReplaceBinaryWithAssignment,
  replaceBinaryWithAssignment
} from "./replace-binary-with-assignment";

import * as t from "../../ast";
import { Selection } from "../../editor/selection";
import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "replaceBinaryWithAssignment",
    operation: replaceBinaryWithAssignment,
    title: "Replace Binary With Assignment"
  },
  actionProvider: {
    message: "Replace binary with assignment",
    isPreferred: true,

    canPerform(ast: t.AST, selection: Selection) {
      const attempt = tryToReplaceBinaryWithAssignment(ast, selection);
      this.message = `Replace = with ${attempt.operator}=`;

      return attempt.canReplace;
    }
  }
};

export default config;
