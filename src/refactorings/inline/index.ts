import * as vscode from "vscode";

import { inlineFunction } from "./inline-function/inline-function";
import { inlineVariable } from "./inline-variable/inline-variable";

import { executeSafely } from "../../commands";
import { ErrorReason } from "../../editor/editor";
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

  const editor = new VSCodeEditorAttemptingInlining(activeTextEditor);

  await executeSafely(async () => {
    await inlineVariable(editor);

    if (!editor.couldInlineCode) {
      await inlineFunction(new VSCodeEditor(activeTextEditor));
    }
  });
}

class VSCodeEditorAttemptingInlining extends VSCodeEditor {
  couldInlineCode = true;

  async showError(reason: ErrorReason) {
    if (reason === ErrorReason.DidNotFindInlinableCode) {
      this.couldInlineCode = false;
      return Promise.resolve();
    }

    await super.showError(reason);
  }
}
