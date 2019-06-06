import * as vscode from "vscode";

import { Refactoring } from "./refactoring";

import { renameSymbol } from "./refactorings/rename-symbol";
import { extractVariable } from "./refactorings/extract-variable";

import { delegateToVSCode } from "./refactorings/adapters/delegate-to-vscode";
import { showErrorMessageInVSCode } from "./refactorings/adapters/show-error-message-in-vscode";
import { WritableVSCode } from "./refactorings/adapters/writable-vscode";
import { createSelectionFromVSCode } from "./refactorings/adapters/selection-from-vscode";

export default {
  renameSymbol: vscode.commands.registerCommand(
    Refactoring.RenameSymbol,
    renameSymbolCommand
  ),
  extractVariable: vscode.commands.registerCommand(
    Refactoring.ExtractVariable,
    extractVariableCommand
  )
};

function renameSymbolCommand() {
  executeSafely(() => renameSymbol(delegateToVSCode));
}

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
      new WritableVSCode(document),
      delegateToVSCode,
      showErrorMessageInVSCode
    )
  );
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

    console.error(err);
  }
}
