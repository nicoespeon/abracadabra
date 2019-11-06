import { commandKey } from "./command";
import { canConvertToTemplateLiteral } from "./convert-to-template-literal";

import { RefactoringWithActionProvider } from "../../types";

const config: RefactoringWithActionProvider = {
  commandKey,
  title: "Convert to Template Literal",
  actionProviderMessage: "Convert to template literal",
  canPerformRefactoring: canConvertToTemplateLiteral,
  isPreferred: true
};

export default config;
