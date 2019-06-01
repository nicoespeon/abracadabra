import * as vscode from "vscode";

import { renameSymbol } from "./refactorings/rename-symbol";
import { extractVariable } from "./refactorings/extract-variable";
import { createSelection } from "./refactorings/selection";

import { delegateToVSCode } from "./refactorings/adapters/delegate-to-vscode";
import { createWriteUpdatesToVSCode } from "./refactorings/adapters/write-updates-to-vscode";

export function activate(context: vscode.ExtensionContext) {
  // `commandId` parameters must match `command` fields in `package.json`.
  const renameSymbolCommand = vscode.commands.registerCommand(
    "refactorix.renameSymbol",
    () => executeSafely(() => renameSymbol(delegateToVSCode))
  );

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
          createSelection(
            [selection.start.line, selection.start.character],
            [selection.end.line, selection.end.character]
          ),
          createWriteUpdatesToVSCode(document.uri),
          delegateToVSCode
        )
      );
    }
  );

  context.subscriptions.push(extractVariableCommand);
  context.subscriptions.push(renameSymbolCommand);
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
