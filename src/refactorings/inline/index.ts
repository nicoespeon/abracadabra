import * as vscode from "vscode";

import { inlineFunction } from "./inline-function/inline-function";
import { inlineVariable } from "./inline-variable/inline-variable";

import { executeSafely } from "../../commands";
import { ErrorReason } from "../../editor/editor";
import { AttemptingEditor } from "../../editor/attempting-editor";
import { VSCodeEditor } from "../../editor/adapters/vscode-editor";
import { Refactoring } from "../../types";

const config: Refactoring = {
  command: {
    key: "inline",
    operation: inline
  }
};

export default config;

async function inline() {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) return;
  const vscodeEditor = new VSCodeEditor(activeTextEditor);

  const attemptingEditor = new AttemptingEditor(
    vscodeEditor,
    ErrorReason.DidNotFindInlinableCode
  );

  await executeSafely(async () => {
    await inlineVariable(attemptingEditor);

    if (!attemptingEditor.attemptSucceeded) {
      await inlineFunction(vscodeEditor);
    }
  });
}
