import * as vscode from "vscode";

import { PutCursorAt } from "../editor/i-put-cursor-at";
import { toVSCodePosition } from "./write-code-in-vscode";

export { createPutCursorAtInVSCode };

function createPutCursorAtInVSCode(editor: vscode.TextEditor): PutCursorAt {
  return async position => {
    const vscodePosition = toVSCodePosition(position);
    editor.selection = new vscode.Selection(vscodePosition, vscodePosition);
  };
}
