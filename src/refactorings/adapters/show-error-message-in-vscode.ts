import * as vscode from "vscode";

import { ShowErrorMessage, ErrorReason } from "../i-show-error-message";

let showErrorMessageInVSCode: ShowErrorMessage;
export { showErrorMessageInVSCode };

showErrorMessageInVSCode = async reason => {
  await vscode.window.showErrorMessage(toString(reason));
};

function toString(reason: ErrorReason): string {
  switch (reason) {
    case ErrorReason.DidNotFoundExtractedCode:
      return "I didn't found a valid code to extract from current selection 🤔";

    default:
      return "";
  }
}
