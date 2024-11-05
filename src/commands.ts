import * as vscode from "vscode";
import { createVSCodeEditor } from "./editor/adapters/create-vscode-editor";
import { VSCodeEditor } from "./editor/adapters/vscode-editor";
import {
  executeRefactoring,
  Refactoring,
  Refactoring__DEPRECATED
} from "./refactorings";

export function createCommand(execute: Refactoring__DEPRECATED) {
  return async (maybeEditor: VSCodeEditor | undefined) => {
    const editor = maybeEditor ?? createVSCodeEditor();
    if (!editor) return;

    await executeSafely(() => execute(editor));
  };
}

export function createCommand__NEW(execute: Refactoring) {
  return async (maybeEditor: VSCodeEditor | undefined) => {
    const editor = maybeEditor ?? createVSCodeEditor();
    if (!editor) return;

    await executeSafely(() => executeRefactoring(execute, editor));
  };
}

export async function executeSafely(
  command: () => Promise<any>
): Promise<void> {
  try {
    await command();
  } catch (error) {
    if (!(error instanceof Error)) return;

    if (error.name === "Canceled") {
      // This happens when "Rename Symbol" is completed.
      // In general, if command is cancelled, we're fine to ignore the error.
      return;
    }

    vscode.window.showErrorMessage(
      `😅 I'm sorry, something went wrong: ${error.message}`
    );
    console.error(error);
  }
}
