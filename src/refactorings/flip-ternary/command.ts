import * as vscode from "vscode";

import { newXXXCreateCommand } from "../../commands";
import { flipTernary } from "./flip-ternary";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.flipTernary";

export default vscode.commands.registerCommand(
  commandKey,
  newXXXCreateCommand(flipTernary)
);
