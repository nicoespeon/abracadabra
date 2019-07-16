import * as vscode from "vscode";

import { executeSafely } from "../../commands";
import { negateExpression } from "./negate-expression";

import { showErrorMessageInVSCode } from "../../editor/adapters/show-error-message-in-vscode";
import {
  createReadThenWriteInVSCode,
  createSelectionFromVSCode
} from "../../editor/adapters/write-code-in-vscode";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.negateExpression";

export default vscode.commands.registerCommand(
  commandKey,
  negateExpressionCommand
);

async function negateExpressionCommand() {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    return;
  }

  const { document, selection } = activeTextEditor;

  await executeSafely(() =>
    negateExpression(
      document.getText(),
      createSelectionFromVSCode(selection),
      createReadThenWriteInVSCode(document),
      showErrorMessageInVSCode
    )
  );
}
