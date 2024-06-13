import * as vscode from "vscode";

import { Operation, Operation__NEW } from "./types";
import { createVSCodeEditor } from "./editor/adapters/create-vscode-editor";
import { VSCodeEditor } from "./editor/adapters/vscode-editor";

export function createCommand(execute: Operation) {
  return async (maybeEditor: VSCodeEditor | undefined) => {
    const editor = maybeEditor ?? createVSCodeEditor();
    if (!editor) return;

    await executeSafely(() => execute(editor));
  };
}

export function createCommand__NEW(execute: Operation__NEW) {
  return async (maybeEditor: VSCodeEditor | undefined) => {
    const editor = maybeEditor ?? createVSCodeEditor();
    if (!editor) return;

    await executeSafely(async () => {
      const { code, selection } = editor;

      const result = execute(code, selection);

      switch (result.action) {
        case "show error":
          editor.showError(result.reason);
          break;

        case "write":
          await editor.write(result.code);
          break;

        default: {
          const exhaustiveCheck: never = result;
          console.error(`Unhandled type: ${exhaustiveCheck}`);
          break;
        }
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
