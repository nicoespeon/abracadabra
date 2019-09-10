import * as vscode from "vscode";

import { createCommand } from "../../commands";
import { mergeWithPreviousIfStatement } from "./merge-with-previous-if-statement";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.mergeWithPreviousIfStatement";

export default vscode.commands.registerCommand(
  commandKey,
  createCommand(mergeWithPreviousIfStatement)
);
