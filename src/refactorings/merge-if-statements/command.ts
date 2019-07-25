import * as vscode from "vscode";

import { createCommand } from "../../commands";
import { mergeIfStatements } from "./merge-if-statements";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.mergeIfStatements";

export default vscode.commands.registerCommand(
  commandKey,
  createCommand(mergeIfStatements)
);
