import * as vscode from "vscode";

import { renameSymbol } from "./refactorings/rename-symbol";
import { extractVariable } from "./refactorings/extract-variable";

import { delegateToVSCode } from "./refactorings/adapters/delegate-to-vscode";
import { createWriteUpdatesToVSCode } from "./refactorings/adapters/write-updates-to-vscode";

export function activate(context: vscode.ExtensionContext) {
  // `commandId` parameters must match `command` fields in `package.json`.
  const renameSymbolCommand = vscode.commands.registerCommand(
    "refactorix.renameSymbol",
    () => renameSymbol(delegateToVSCode)
  );

  const extractVariableCommand = vscode.commands.registerCommand(
    "refactorix.extractVariable",
    () => {
      const activeTextEditor = vscode.window.activeTextEditor;
      if (!activeTextEditor) {
        return;
      }

      const { document, selection } = activeTextEditor;

      extractVariable(
        document.getText(),
        selection,
        createWriteUpdatesToVSCode(document.uri)
      );
    }
  );

  context.subscriptions.push(extractVariableCommand);
  context.subscriptions.push(renameSymbolCommand);
}

export function deactivate() {}
