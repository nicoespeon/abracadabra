import * as vscode from "vscode";

import { newXXXCreateCommand } from "../../commands";
import { convertTernaryToIfElse } from "./convert-ternary-to-if-else";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.convertTernaryToIfElse";

export default vscode.commands.registerCommand(
  commandKey,
  newXXXCreateCommand(convertTernaryToIfElse)
);
