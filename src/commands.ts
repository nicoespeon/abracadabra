import * as vscode from "vscode";
import { createVSCodeEditor } from "./editor/adapters/create-vscode-editor";
import { VSCodeEditor } from "./editor/adapters/vscode-editor";
import { refreshHighlights } from "./highlights/refresh-highlights/refresh-highlights";
import {
  executeRefactoring,
  Refactoring,
  Refactoring__DEPRECATED
} from "./refactorings";

type Options = { refreshHighlights: boolean };

export function createCommand(
  execute: Refactoring__DEPRECATED,
  options: Options
) {
  return async (maybeEditor: VSCodeEditor | undefined) => {
    const editor = maybeEditor ?? createVSCodeEditor();
    if (!editor) return;

    await executeSafely(async () => {
      await execute(editor);
      if (options.refreshHighlights) {
        await refreshHighlights(editor);
      }
    });
  };
}

export function createCommand__NEW(execute: Refactoring, options: Options) {
  return async (maybeEditor: VSCodeEditor | undefined) => {
    const editor = maybeEditor ?? createVSCodeEditor();
    if (!editor) return;

    await executeSafely(async () => {
      await executeRefactoring(execute, editor);
      if (options.refreshHighlights) {
        await refreshHighlights(editor);
      }
    });
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
