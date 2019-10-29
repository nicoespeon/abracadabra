import {
  createActionProviderFor,
  RefactoringActionProvider
} from "../../action-providers";

import { commandKey } from "./command";
import { canConvertToTemplateLiteral } from "./convert-to-template-literal";

class ConvertToTemplateLiteralActionProvider extends RefactoringActionProvider {
  actionMessage = "Convert to template literal";
  commandKey = commandKey;
  title = "Convert to Template Literal";
  canPerformRefactoring = canConvertToTemplateLiteral;
  isPreferred = true;
}

export default createActionProviderFor(
  new ConvertToTemplateLiteralActionProvider()
);
