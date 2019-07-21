import * as vscode from "vscode";

import { createCommand } from "../../commands";
import { removeBracesFromArrowFunction } from "./remove-braces-from-arrow-function";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.removeBracesFromArrowFunction";

export default vscode.commands.registerCommand(
  commandKey,
  createCommand(removeBracesFromArrowFunction)
);
