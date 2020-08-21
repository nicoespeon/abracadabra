import {
  canBubbleUpIfStatement,
  bubbleUpIfStatement
} from "./bubble-up-if-statement";

import { DeprecatedRefactoringWithActionProvider } from "../../types";

const config: DeprecatedRefactoringWithActionProvider = {
  command: {
    key: "bubbleUpIfStatement",
    operation: bubbleUpIfStatement,
    title: "Bubble Up If Statement"
  },
  actionProvider: {
    message: "Bubble up if statement",
    createVisitor: canBubbleUpIfStatement,
    isPreferred: true
  }
};

export default config;
