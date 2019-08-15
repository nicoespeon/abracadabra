import * as vscode from "vscode";

import { newXXXCreateCommand } from "../../commands";
import { moveStatementDown } from "./move-statement-down";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.moveStatementDown";

export default vscode.commands.registerCommand(
  commandKey,
  newXXXCreateCommand(moveStatementDown)
);
