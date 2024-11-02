import { executeSafely } from "../../commands";
import { AttemptingEditor } from "../../editor/adapters/attempting-editor";
import { createVSCodeEditor } from "../../editor/adapters/create-vscode-editor";
import { ErrorReason } from "../../editor/editor";
import { RefactoringWithActionProviderConfig } from "../../refactorings";
import { inlineFunction } from "./inline-function/inline-function";
import {
  createVisitor as canInlineVariable,
  inlineVariable
} from "./inline-variable/inline-variable";

const config: RefactoringWithActionProviderConfig = {
  command: {
    key: "inline",
    title: "Inline Variable/Function",
    operation: inline
  },
  actionProvider: {
    // Only support Inline Variable as a quick fix for now.
    message: "Inline variable",
    createVisitor: canInlineVariable
  }
};

export default config;

async function inline() {
  const vscodeEditor = createVSCodeEditor();
  if (!vscodeEditor) return;

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
