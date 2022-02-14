import * as vscode from "vscode";

import { VSCodeEditor } from "./vscode-editor";
import { VueVSCodeEditor } from "./vue-vscode-editor";

export function createVSCodeEditor(): VSCodeEditor | undefined {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) return;

  return activeTextEditor.document.languageId === "vue"
    ? new VueVSCodeEditor(activeTextEditor)
    : new VSCodeEditor(activeTextEditor);
}
