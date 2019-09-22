import * as vscode from "vscode";

import { createCommand } from "../../commands";
import { removeDeadCode } from "./remove-dead-code";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.removeDeadCode";

export default vscode.commands.registerCommand(
  commandKey,
  createCommand(removeDeadCode)
);
