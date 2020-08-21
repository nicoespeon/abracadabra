import * as vscode from "vscode";

import { extractGenericType } from "./extract-generic-type/extract-generic-type";
import { extractVariable } from "./extract-variable/extract-variable";

import { executeSafely } from "../../commands";
import { ErrorReason } from "../../editor/editor";
import { VSCodeEditor } from "../../editor/adapters/vscode-editor";

import { DeprecatedRefactoring } from "../../types";

const config: DeprecatedRefactoring = {
  command: {
    key: "extract",
    operation: extract
  }
};

export default config;

async function extract() {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) return;

  await executeSafely(async () => {
    const editorAttemptingExtraction = new VSCodeEditorAttemptingExtraction(
      activeTextEditor
    );
    await extractVariable(
      editorAttemptingExtraction.code,
      editorAttemptingExtraction.selection,
      editorAttemptingExtraction
    );

    if (!editorAttemptingExtraction.couldExtract) {
      const editor = new VSCodeEditor(activeTextEditor);
      await extractGenericType(editor.code, editor.selection, editor);
    }
  });
}

class VSCodeEditorAttemptingExtraction extends VSCodeEditor {
  couldExtract = true;

  async showError(reason: ErrorReason) {
    if (reason === ErrorReason.DidNotFindExtractableCode) {
      this.couldExtract = false;
      return Promise.resolve();
    }

    await super.showError(reason);
  }
}
