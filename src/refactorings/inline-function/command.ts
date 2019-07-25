import * as vscode from "vscode";

import { createCommand } from "../../commands";
import { inlineFunction } from "./inline-function";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.inlineFunction";

export default vscode.commands.registerCommand(
  commandKey,
  createCommand(inlineFunction)
);
