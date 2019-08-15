import * as vscode from "vscode";

import { createCommand } from "../../commands";
import { extractVariable } from "./extract-variable";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.extractVariable";

export default vscode.commands.registerCommand(
  commandKey,
  createCommand(extractVariable)
);
