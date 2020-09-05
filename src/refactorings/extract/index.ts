import * as vscode from "vscode";

import { extractGenericType } from "./extract-generic-type/extract-generic-type";
import { extractVariable } from "./extract-variable/extract-variable";

import { Refactoring } from "../../types";
import { executeSafely } from "../../commands";
import { ErrorReason } from "../../editor/editor";
import { AttemptingEditor } from "../../editor/attempting-editor";
import { VSCodeEditor } from "../../editor/adapters/vscode-editor";

const config: Refactoring = {
  command: {
    key: "extract",
    operation: extract
  }
};

export default config;

async function extract() {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) return;
  const vscodeEditor = new VSCodeEditor(activeTextEditor);

  const attemptingEditor = new AttemptingEditor(
    vscodeEditor,
    ErrorReason.DidNotFindExtractableCode
  );

  await executeSafely(async () => {
    await extractVariable(attemptingEditor);

    if (!attemptingEditor.attemptSucceeded) {
      await extractGenericType(vscodeEditor);
    }
  });
}
