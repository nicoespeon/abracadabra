import { extractVariable } from "./extract-variable/extract-variable";
import { extractType } from "./extract-type/extract-type";

import { RefactoringConfig } from "../../refactorings";
import { executeSafely } from "../../commands";
import { ErrorReason } from "../../editor/editor";
import { AttemptingEditor } from "../../editor/adapters/attempting-editor";
import { createVSCodeEditor } from "../../editor/adapters/create-vscode-editor";

const config: RefactoringConfig = {
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
    ErrorReason.DidNotFindTypeToExtract
  );

  await executeSafely(async () => {
    await extractType(attemptingEditor);

    if (!attemptingEditor.attemptSucceeded) {
      await extractVariable(vscodeEditor);
    }
  });
}
