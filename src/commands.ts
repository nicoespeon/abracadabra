import * as vscode from "vscode";

import { Code, Write } from "./editor/i-write-code";
import { Selection } from "./editor/selection";
import { ShowErrorMessage } from "./editor/i-show-error-message";

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

type Refactoring = (
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) => Promise<void>;

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
