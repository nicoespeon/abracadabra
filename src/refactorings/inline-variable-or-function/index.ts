import * as vscode from "vscode";

import { inlineFunction } from "./inline-function";
import { inlineVariable } from "./inline-variable";

import { executeSafely } from "../../commands";
import { ErrorReason } from "../../editor/editor";
import {
  VSCodeEditor,
  createSelectionFromVSCode
} from "../../editor/adapters/vscode-editor";

import { Refactoring } from "../../types";

const config: Refactoring = {
  commandKey: "abracadabra.inlineVariableOrFunction",
  operation: inlineVariableOrFunction
};

export default config;

async function inlineVariableOrFunction() {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    return;
  }

  const { document, selection } = activeTextEditor;

  await executeSafely(async () => {
    const code = document.getText();
    const selectionFromVSCode = createSelectionFromVSCode(selection);

    const editor = new VSCodeEditorAttemptingInlining(activeTextEditor);
    await inlineVariable(code, selectionFromVSCode, editor);

    if (!editor.couldInlineCode) {
      await inlineFunction(
        code,
        selectionFromVSCode,
        new VSCodeEditor(activeTextEditor)
      );
    }
  });
}

class VSCodeEditorAttemptingInlining extends VSCodeEditor {
  couldInlineCode = true;

  async showError(reason: ErrorReason) {
    if (reason === ErrorReason.DidNotFoundInlinableCode) {
      this.couldInlineCode = false;
      return Promise.resolve();
    }

    await super.showError(reason);
  }
}
