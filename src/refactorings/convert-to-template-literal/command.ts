import * as vscode from "vscode";

import { newXXXCreateCommand } from "../../commands";
import { convertToTemplateLiteral } from "./convert-to-template-literal";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.convertToTemplateLiteral";

export default vscode.commands.registerCommand(
  commandKey,
  newXXXCreateCommand(convertToTemplateLiteral)
);
