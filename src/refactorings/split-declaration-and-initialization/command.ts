import * as vscode from "vscode";

import { newXXXCreateCommand } from "../../commands";
import { splitDeclarationAndInitialization } from "./split-declaration-and-initialization";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.splitDeclarationAndInitialization";

export default vscode.commands.registerCommand(
  commandKey,
  newXXXCreateCommand(splitDeclarationAndInitialization)
);
