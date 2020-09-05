import * as vscode from "vscode";

import { Editor } from "../editor";
import { VSCodeEditor } from "./vscode-editor";
import { VueVSCodeEditor } from "./vue-vscode-editor";

export { createVSCodeEditor };

function createVSCodeEditor(): Editor | undefined {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) return;

  return activeTextEditor.document.languageId === "vue"
    ? new VueVSCodeEditor(activeTextEditor)
    : new VSCodeEditor(activeTextEditor);
}
