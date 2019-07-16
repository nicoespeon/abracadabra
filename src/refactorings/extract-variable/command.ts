import * as vscode from "vscode";

import { executeSafely } from "../../commands";
import { extractVariable } from "./extract-variable";

import { delegateToVSCode } from "../../editor/adapters/delegate-to-vscode";
import { showErrorMessageInVSCode } from "../../editor/adapters/show-error-message-in-vscode";
import {
  createReadThenWriteInVSCode,
  createSelectionFromVSCode
} from "../../editor/adapters/write-code-in-vscode";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.extractVariable";

export default vscode.commands.registerCommand(
  commandKey,
  extractVariableCommand
);

async function extractVariableCommand() {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    return;
  }

  const { document, selection } = activeTextEditor;

  await executeSafely(() =>
    extractVariable(
      document.getText(),
      createSelectionFromVSCode(selection),
      createReadThenWriteInVSCode(document),
      delegateToVSCode,
      showErrorMessageInVSCode
    )
  );
}
