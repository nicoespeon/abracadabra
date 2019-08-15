import * as vscode from "vscode";

import { newXXXCreateCommand } from "../../commands";
import { convertIfElseToTernary } from "./convert-if-else-to-ternary";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.convertIfElseToTernary";

export default vscode.commands.registerCommand(
  commandKey,
  newXXXCreateCommand(convertIfElseToTernary)
);
