import * as vscode from "vscode";

import { renameSymbol } from "./refactorings/rename-symbol";
import { extractVariable } from "./refactorings/extract-variable";
import { Selection } from "./refactorings/selection";

import { delegateToVSCode } from "./refactorings/adapters/delegate-to-vscode";
import { showErrorMessageInVSCode } from "./refactorings/adapters/show-error-message-in-vscode";
import { createWriteUpdatesToVSCode } from "./refactorings/adapters/write-updates-to-vscode";

export function activate(context: vscode.ExtensionContext) {
  // `commandId` parameters must match `command` fields in `package.json`.
  const renameSymbolCommand = vscode.commands.registerCommand(
    "refactorix.renameSymbol",
    () => executeSafely(() => renameSymbol(delegateToVSCode))
  );
  context.subscriptions.push(renameSymbolCommand);

  const extractVariableCommand = vscode.commands.registerCommand(
    "refactorix.extractVariable",
    async () => {
      const activeTextEditor = vscode.window.activeTextEditor;
      if (!activeTextEditor) {
        return;
      }

      const { document, selection } = activeTextEditor;

      await executeSafely(() =>
        extractVariable(
          document.getText(),
          createSelectionFromVSCode(selection),
          createWriteUpdatesToVSCode(document.uri),
          delegateToVSCode,
          showErrorMessageInVSCode
        )
      );
    }
  );

  context.subscriptions.push(extractVariableCommand);
}

export function deactivate() {}

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

function createSelectionFromVSCode(selection: vscode.Selection): Selection {
  return new Selection(
    [selection.start.line, selection.start.character],
    [selection.end.line, selection.end.character]
  );
}
