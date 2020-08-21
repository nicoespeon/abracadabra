import {
  canConvertToTemplateLiteral,
  convertToTemplateLiteral
} from "./convert-to-template-literal";

import { DeprecatedRefactoringWithActionProvider } from "../../types";

const config: DeprecatedRefactoringWithActionProvider = {
  command: {
    key: "convertToTemplateLiteral",
    operation: convertToTemplateLiteral,
    title: "Convert to Template Literal"
  },
  actionProvider: {
    message: "Convert to template literal",
    createVisitor: canConvertToTemplateLiteral,
    isPreferred: true
  }
};

export default config;
