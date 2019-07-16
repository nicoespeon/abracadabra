import * as vscode from "vscode";

import { Refactoring } from "./refactorings/refactoring";

import { showErrorMessageInVSCode } from "./editor/adapters/show-error-message-in-vscode";
import {
  createWriteInVSCode,
  createSelectionFromVSCode
} from "./editor/adapters/write-code-in-vscode";

export { createCommand, executeSafely };

function createCommand(refactoring: Refactoring) {
  return async () => {
    const activeTextEditor = vscode.window.activeTextEditor;
    if (!activeTextEditor) {
      return;
    }

    const { document, selection } = activeTextEditor;

    await executeSafely(() =>
      refactoring(
        document.getText(),
        createSelectionFromVSCode(selection),
        createWriteInVSCode(activeTextEditor),
        showErrorMessageInVSCode
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
