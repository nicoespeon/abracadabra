import * as vscode from "vscode";

import { executeSafely } from "../../commands";
import { VSCodeEditor } from "../../editor/adapters/vscode-editor";
import { renameSymbol } from "./rename-symbol";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.renameSymbol";

export default vscode.commands.registerCommand(commandKey, renameSymbolCommand);

async function renameSymbolCommand() {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    return;
  }

  await executeSafely(() => renameSymbol(new VSCodeEditor(activeTextEditor)));
}
