import { RefactoringWithActionProviderConfig } from "../../refactorings";
import {
  convertCommentToJSDoc,
  createVisitor
} from "./convert-comment-to-jsdoc";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "convertCommentToJSDoc",
    operation: convertCommentToJSDoc,
    title: "Convert Comment to JSDoc"
  },
  actionProvider: {
    message: "Convert to JSDoc",
    createVisitor
  }
};

export default config;
