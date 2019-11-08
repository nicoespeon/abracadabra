import { commandKey } from "./command";
import {
  canBubbleUpIfStatement,
  bubbleUpIfStatement
} from "./bubble-up-if-statement";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey,
  operation: bubbleUpIfStatement,
  title: "Bubble Up If Statement",
  actionProviderMessage: "Bubble up if statement",
  canPerformRefactoring: canBubbleUpIfStatement,
  isPreferred: true
};

export default config;
