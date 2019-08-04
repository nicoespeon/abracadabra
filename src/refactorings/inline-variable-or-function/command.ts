import * as vscode from "vscode";

import { executeSafely } from "../../commands";
import { inlineFunction } from "./inline-function";
import { inlineVariable } from "./inline-variable";

import { showErrorMessageInVSCode } from "../../editor/adapters/show-error-message-in-vscode";
import {
  createReadThenWriteInVSCode,
  createSelectionFromVSCode,
  createWriteInVSCode
} from "../../editor/adapters/write-code-in-vscode";
import { ErrorReason } from "../../editor/i-show-error-message";

// Must match `command` field in `package.json`
export const commandKey = "abracadabra.inlineVariableOrFunction";

export default vscode.commands.registerCommand(
  commandKey,
  inlineVariableOrFunctionCommand
);

async function inlineVariableOrFunctionCommand() {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    return;
  }

  const { document, selection } = activeTextEditor;

  await executeSafely(async () => {
    const code = document.getText();
    const selectionFromVSCode = createSelectionFromVSCode(selection);

    /**
     * We start trying to inline a variable.
     *
     * If it can't be inlined, we don't show an error yet
     * and try to inline a function instead.
     *
     * If it also can't be inlined, then we show the error.
     */
    let couldInlineCode = true;
    const showErrorIfCouldInlineCode = (reason: ErrorReason) => {
      if (reason === ErrorReason.DidNotFoundInlinableCode) {
        couldInlineCode = false;
        return Promise.resolve();
      }

      return showErrorMessageInVSCode(reason);
    };

    await inlineVariable(
      code,
      selectionFromVSCode,
      createReadThenWriteInVSCode(document),
      showErrorIfCouldInlineCode
    );

    if (!couldInlineCode) {
      couldInlineCode = true;
      await inlineFunction(
        code,
        selectionFromVSCode,
        createWriteInVSCode(activeTextEditor),
        showErrorIfCouldInlineCode
      );
    }

    if (!couldInlineCode) {
      await showErrorMessageInVSCode(ErrorReason.DidNotFoundInlinableCode);
    }
  });
}
