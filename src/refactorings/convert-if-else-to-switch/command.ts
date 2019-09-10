import * as vscode from "vscode";

import { createCommand } from "../../commands";
import { convertIfElseToSwitch } from "./convert-if-else-to-switch";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.convertIfElseToSwitch";

export default vscode.commands.registerCommand(
  commandKey,
  createCommand(convertIfElseToSwitch)
);
