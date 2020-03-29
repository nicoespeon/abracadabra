import {
  canBubbleUpIfStatement,
  bubbleUpIfStatement
} from "./bubble-up-if-statement";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
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
