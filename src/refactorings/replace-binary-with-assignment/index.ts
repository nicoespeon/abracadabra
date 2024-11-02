import {
  replaceBinaryWithAssignment,
  createVisitor
} from "./replace-binary-with-assignment";

import * as t from "../../ast";
import { RefactoringWithActionProvider } from "../../refactorings";

const config: RefactoringWithActionProvider = {
  command: {
    key: "replaceBinaryWithAssignment",
    operation: replaceBinaryWithAssignment,
    title: "Replace Binary With Assignment"
  },
  actionProvider: {
    message: "Replace binary with assignment",
    isPreferred: true,
    createVisitor,
    updateMessage(path: t.NodePath) {
      const { node } = path as t.NodePath<t.AssignmentExpression>;

      const binaryExpression = node.right as t.BinaryExpression;
      const operator = binaryExpression.operator;
      return `Replace = with ${operator}=`;
    }
  }
};

export default config;
