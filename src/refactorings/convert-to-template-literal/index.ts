import { RefactoringWithActionProviderConfig__DEPRECATED } from "../../refactorings";
import {
  convertToTemplateLiteral,
  createVisitor
} from "./convert-to-template-literal";

const config: RefactoringWithActionProviderConfig__DEPRECATED = {
  command: {
    key: "convertToTemplateLiteral",
    operation: convertToTemplateLiteral,
    title: "Convert to Template Literal"
  },
  actionProvider: {
    message: "Convert to template literal",
    createVisitor,
    isPreferred: true
  }
};

export default config;
