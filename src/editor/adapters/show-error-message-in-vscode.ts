import * as vscode from "vscode";

import { ShowErrorMessage, toString } from "../i-show-error-message";

let showErrorMessageInVSCode: ShowErrorMessage;
export { showErrorMessageInVSCode };

showErrorMessageInVSCode = async reason => {
  await vscode.window.showErrorMessage(toString(reason));
};
