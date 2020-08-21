import * as vscode from "vscode";

import { extractGenericType } from "./extract-generic-type/extract-generic-type";
import { extractVariable } from "./extract-variable/extract-variable";

import { executeSafely } from "../../commands";
import { ErrorReason } from "../../editor/editor";
import { VSCodeEditor } from "../../editor/adapters/vscode-editor";

import { Refactoring } from "../../types";

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

  await executeSafely(async () => {
    await extractVariable(
      new VSCodeEditorAttemptingExtraction(activeTextEditor)
    );

    if (!new VSCodeEditorAttemptingExtraction(activeTextEditor).couldExtract) {
      await extractGenericType(new VSCodeEditor(activeTextEditor));
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
