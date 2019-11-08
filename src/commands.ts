import * as vscode from "vscode";

import { Operation } from "./types";

import {
  VSCodeEditor,
  createSelectionFromVSCode
} from "./editor/adapters/vscode-editor";

export { createCommand, executeSafely };

function createCommand(execute: Operation) {
  return async () => {
    const activeTextEditor = vscode.window.activeTextEditor;
    if (!activeTextEditor) {
      return;
    }

    const { document, selection } = activeTextEditor;

    await executeSafely(() =>
      execute(
        document.getText(),
        createSelectionFromVSCode(selection),
        new VSCodeEditor(activeTextEditor)
      )
    );
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
