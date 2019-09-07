import * as vscode from "vscode";

import { createCommand } from "../../commands";
import { bubbleUpIfStatement } from "./bubble-up-if-statement";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.bubbleUpIfStatement";

export default vscode.commands.registerCommand(
  commandKey,
  createCommand(bubbleUpIfStatement)
);
