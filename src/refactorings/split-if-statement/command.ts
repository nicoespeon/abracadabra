import * as vscode from "vscode";

import { newXXXCreateCommand } from "../../commands";
import { splitIfStatement } from "./split-if-statement";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.splitIfStatement";

export default vscode.commands.registerCommand(
  commandKey,
  newXXXCreateCommand(splitIfStatement)
);
