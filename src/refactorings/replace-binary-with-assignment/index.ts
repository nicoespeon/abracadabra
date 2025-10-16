import * as t from "../../ast";
import { RefactoringWithActionProviderConfig } from "../../refactorings";
import {
  createVisitor,
  replaceBinaryWithAssignment
} from "./replace-binary-with-assignment";

const config: RefactoringWithActionProviderConfig = {
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
