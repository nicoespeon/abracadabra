import {
  replaceBinaryWithAssignment,
  canReplaceBinaryWithAssignment
} from "./replace-binary-with-assignment";

import * as t from "../../ast";
import { RefactoringWithActionProvider, ActionProvider } from "../../types";

const config: RefactoringWithActionProvider<
  ActionProvider<t.AssignmentExpression>
> = {
  command: {
    key: "replaceBinaryWithAssignment",
    operation: replaceBinaryWithAssignment,
    title: "Replace Binary With Assignment"
  },
  actionProvider: {
    message: "Replace binary with assignment",
    isPreferred: true,
    createVisitor: canReplaceBinaryWithAssignment,
    updateMessage({ node }) {
      if (!t.isBinaryExpression(node.right)) return this.message;

      const operator = node.right.operator;
      return `Replace = with ${operator}=`;
    }
  }
};

export default config;
