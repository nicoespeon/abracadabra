import {
  canBubbleUpIfStatementVisitorFactory,
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
    canPerformVisitorFactory: canBubbleUpIfStatementVisitorFactory,
    isPreferred: true
  }
};

export default config;
