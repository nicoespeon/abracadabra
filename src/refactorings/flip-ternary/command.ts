import * as vscode from "vscode";

import { createCommand } from "../../commands";
import { flipTernary } from "./flip-ternary";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.flipTernary";

export default vscode.commands.registerCommand(
  commandKey,
  createCommand(flipTernary)
);
