import * as vscode from "vscode";

import { VSCodeEditor } from "./vscode-editor";
import { VueAndSvelteVSCodeEditor } from "./vue-and-svelte-vscode-editor";

export function createVSCodeEditor(): VSCodeEditor | undefined {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) return;

  return activeTextEditor.document.languageId === "vue" ||
    activeTextEditor.document.languageId === "svelte"
    ? new VueAndSvelteVSCodeEditor(activeTextEditor)
    : new VSCodeEditor(activeTextEditor);
}
