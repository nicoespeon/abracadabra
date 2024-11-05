import { RefactoringWithActionProviderConfig__DEPRECATED } from "../../refactorings";
import {
  convertIfElseToSwitch,
  createVisitor
} from "./convert-if-else-to-switch";

const config: RefactoringWithActionProviderConfig__DEPRECATED = {
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
