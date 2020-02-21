import {
  tryToReplaceBinaryWithAssignment,
  replaceBinaryWithAssignment,
  canReplaceBinaryWithAssignment
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
    createVisitor: canReplaceBinaryWithAssignment,
    updateMessage(path: t.NodePath<t.AssignmentExpression>) {
      const { node } = path;

      const binaryExpression = node.right as t.BinaryExpression;
      const operator = binaryExpression.operator;
      this.message = `Replace = with ${operator}=`;
    }
  }
};

export default config;
