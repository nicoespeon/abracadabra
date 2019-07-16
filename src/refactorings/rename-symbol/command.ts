import * as vscode from "vscode";

import { executeSafely } from "../../commands";
import { renameSymbol } from "./rename-symbol";

import { delegateToVSCode } from "../../editor/adapters/delegate-to-vscode";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.renameSymbol";

export default vscode.commands.registerCommand(commandKey, renameSymbolCommand);

function renameSymbolCommand() {
  executeSafely(() => renameSymbol(delegateToVSCode));
}
