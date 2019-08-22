import * as vscode from "vscode";

import { createCommand } from "../../commands";
import { replaceBinaryWithAssignment } from "./replace-binary-with-assignment";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.replaceBinaryWithAssignment";

export default vscode.commands.registerCommand(
  commandKey,
  createCommand(replaceBinaryWithAssignment)
);
