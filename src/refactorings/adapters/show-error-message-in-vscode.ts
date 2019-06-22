import * as vscode from "vscode";

import { ShowErrorMessage, ErrorReason } from "../i-show-error-message";

let showErrorMessageInVSCode: ShowErrorMessage;
export { showErrorMessageInVSCode };

showErrorMessageInVSCode = async reason => {
  await vscode.window.showErrorMessage(toString(reason));
};

function toString(reason: ErrorReason): string {
  switch (reason) {
    case ErrorReason.DidNotFoundExtractableCode:
      return "I didn't found a valid code to extract from current selection 🤔";

    case ErrorReason.DidNotFoundInlinableCode:
      return "I didn't found a valid code to inline from current selection 🤔";

    case ErrorReason.DidNotFoundInlinableCodeIdentifiers:
      return "I didn't found references of this variable in the code 🤔";

    case ErrorReason.DidNotFoundNegatableExpression:
      return "I didn't found a valid expression to negate from current selection 🤔";

    case ErrorReason.DidNotFoundRedundantElse:
      return "I didn't found a redundant else to remove from current selection 🤔";

    case ErrorReason.DidNotFoundIfElseToFlip:
      return "I didn't found an if statement to flip from current selection 🤔";

    case ErrorReason.DidNotFoundTernaryToFlip:
      return "I didn't found a ternary to flip from current selection 🤔";

    case ErrorReason.CantInlineExportedVariables:
      return "I'm sorry, I can't inline exported variables yet 😅";

    case ErrorReason.CantInlineRedeclaredVariables:
      return "I'm sorry, I can't inline redeclared variables yet 😅";

    default:
      return "I'm sorry, something went wrong but I'm not sure what 😅";
  }
}
