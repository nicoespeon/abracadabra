import { RefactoringWithActionProviderConfig } from "../../refactorings";
import {
  convertIfElseToSwitch,
  createVisitor
} from "./convert-if-else-to-switch";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "convertIfElseToSwitch",
    operation: convertIfElseToSwitch,
    title: "Convert If/Else to Switch"
  },
  actionProvider: {
    message: "Convert if/else to switch",
    createVisitor,
    isPreferred: true
  }
};

export default config;
