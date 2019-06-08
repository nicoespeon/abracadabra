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

    default:
      return "I'm sorry, something went wrong but I'm not sure what 😅";
  }
}
