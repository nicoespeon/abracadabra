import * as vscode from "vscode";

import { executeSafely } from "../../commands";
import { inlineVariable } from "./inline-variable";

import { showErrorMessageInVSCode } from "../../editor/adapters/show-error-message-in-vscode";
import {
  createReadThenWriteInVSCode,
  createSelectionFromVSCode
} from "../../editor/adapters/write-code-in-vscode";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.inlineVariable";

export default vscode.commands.registerCommand(
  commandKey,
  inlineVariableCommand
);

async function inlineVariableCommand() {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    return;
  }

  const { document, selection } = activeTextEditor;

  await executeSafely(() =>
    inlineVariable(
      document.getText(),
      createSelectionFromVSCode(selection),
      createReadThenWriteInVSCode(document),
      showErrorMessageInVSCode
    )
  );
}
