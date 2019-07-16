import * as vscode from "vscode";

import { RefactoringCommand } from "./refactoring-command";

import { renameSymbol } from "./refactorings/rename-symbol";
import { removeRedundantElse } from "./refactorings/remove-redundant-else";
import { Refactoring } from "./refactorings/refactoring";

import { delegateToVSCode } from "./editor/adapters/delegate-to-vscode";
import { showErrorMessageInVSCode } from "./editor/adapters/show-error-message-in-vscode";
import {
  createWriteInVSCode,
  createSelectionFromVSCode
} from "./editor/adapters/write-code-in-vscode";

export default [
  vscode.commands.registerCommand(
    RefactoringCommand.RenameSymbol,
    renameSymbolCommand
  ),
  vscode.commands.registerCommand(
    RefactoringCommand.RemoveRedundantElse,
    createCommand(removeRedundantElse)
  )
];

function renameSymbolCommand() {
  executeSafely(() => renameSymbol(delegateToVSCode));
}

export function createCommand(refactoring: Refactoring) {
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

export async function executeSafely(
  command: () => Promise<any>
): Promise<void> {
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
