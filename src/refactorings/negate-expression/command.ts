import * as vscode from "vscode";

import { createCommand } from "../../commands";
import { negateExpression } from "./negate-expression";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.negateExpression";

export default vscode.commands.registerCommand(
  commandKey,
  createCommand(negateExpression)
);
