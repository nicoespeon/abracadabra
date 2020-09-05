import * as vscode from "vscode";

import { Operation } from "./types";
import { createVSCodeEditor } from "./editor/adapters/create-vscode-editor";

export { createCommand, executeSafely };

function createCommand(execute: Operation) {
  return async () => {
    const editor = createVSCodeEditor();
    if (!editor) return;

    await executeSafely(() => execute(editor));
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
