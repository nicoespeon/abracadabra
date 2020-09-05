import { extractGenericType } from "./extract-generic-type/extract-generic-type";
import { extractVariable } from "./extract-variable/extract-variable";

import { Refactoring } from "../../types";
import { executeSafely } from "../../commands";
import { ErrorReason } from "../../editor/editor";
import { AttemptingEditor } from "../../editor/attempting-editor";
import { createVSCodeEditor } from "../../editor/adapters/create-vscode-editor";

const config: Refactoring = {
  command: {
    key: "extract",
    operation: extract
  }
};

export default config;

async function extract() {
  const vscodeEditor = createVSCodeEditor();
  if (!vscodeEditor) return;

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
