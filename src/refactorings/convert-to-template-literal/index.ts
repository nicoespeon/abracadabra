import {
  canConvertToTemplateLiteralVisitorFactory,
  convertToTemplateLiteral
} from "./convert-to-template-literal";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  command: {
    key: "convertToTemplateLiteral",
    operation: convertToTemplateLiteral,
    title: "Convert to Template Literal"
  },
  actionProvider: {
    message: "Convert to template literal",
    canPerformVisitorFactory: canConvertToTemplateLiteralVisitorFactory,
    isPreferred: true
  }
};

export default config;
