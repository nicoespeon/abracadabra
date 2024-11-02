import {
  createVisitor,
  convertToTemplateLiteral
} from "./convert-to-template-literal";

import { RefactoringWithActionProvider } from "../../refactorings";

const config: RefactoringWithActionProvider = {
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
