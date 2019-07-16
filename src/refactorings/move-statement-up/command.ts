import * as vscode from "vscode";

import { createCommand } from "../../commands";
import { moveStatementUp } from "./move-statement-up";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.moveStatementUp";

export default vscode.commands.registerCommand(
  commandKey,
  createCommand(moveStatementUp)
);
