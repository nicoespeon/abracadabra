import {
  canConvertToTemplateLiteral,
  convertToTemplateLiteral
} from "./convert-to-template-literal";

import { xxxnew_RefactoringWithActionProvider } from "../../types";

const config: xxxnew_RefactoringWithActionProvider = {
  command: {
    key: "convertToTemplateLiteral",
    operation: convertToTemplateLiteral,
    title: "Convert to Template Literal"
  },
  actionProvider: {
    message: "Convert to template literal",
    canPerform: canConvertToTemplateLiteral,
    isPreferred: true
  }
};

export default config;
