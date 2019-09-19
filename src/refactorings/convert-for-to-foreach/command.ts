import * as vscode from "vscode";

import { createCommand } from "../../commands";
import { convertForToForeach } from "./convert-for-to-foreach";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.convertForToForeach";

export default vscode.commands.registerCommand(
  commandKey,
  createCommand(convertForToForeach)
);
