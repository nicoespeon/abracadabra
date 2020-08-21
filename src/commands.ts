import * as vscode from "vscode";

import { DeprecatedOperation } from "./types";
import { VSCodeEditor } from "./editor/adapters/vscode-editor";

export { createCommand, executeSafely };

function createCommand(execute: DeprecatedOperation) {
  return async () => {
    const activeTextEditor = vscode.window.activeTextEditor;
    if (!activeTextEditor) {
      return;
    }

    const editor = new VSCodeEditor(activeTextEditor);
    await executeSafely(() => execute(editor.code, editor.selection, editor));
  };
}

async function executeSafely(command: () => Promise<any>): Promise<void> {
  try {
    await command();
  } catch (err) {
    if (err.name === "Canceled") {
      // This happens when "Rename Symbol" is completed.
      // In general, if command is cancelled, we're fine to ignore the error.
      return;
    }

    vscode.window.showErrorMessage(
      `😅 I'm sorry, something went wrong: ${err.message}`
    );
    console.error(err);
  }
}
