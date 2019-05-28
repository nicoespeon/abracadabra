import * as vscode from "vscode";

import { renameSymbol } from "./refactorings/rename-symbol";
import { delegateToVSCode } from "./refactorings/adapters/delegate-to-vscode";

export function activate(context: vscode.ExtensionContext) {
  // `commandId` parameters must match `command` fields in `package.json`.
  const renameSymbolCommand = vscode.commands.registerCommand(
    "refactorix.renameSymbol",
    () => renameSymbol(delegateToVSCode)
  );

  context.subscriptions.push(renameSymbolCommand);
}

export function deactivate() {}
