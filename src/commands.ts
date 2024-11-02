import * as vscode from "vscode";
import { createVSCodeEditor } from "./editor/adapters/create-vscode-editor";
import { VSCodeEditor } from "./editor/adapters/vscode-editor";
import {
  Refactoring,
  Refactoring__NEW,
  RefactoringState
} from "./refactorings";

export function createCommand(execute: Refactoring) {
  return async (maybeEditor: VSCodeEditor | undefined) => {
    const editor = maybeEditor ?? createVSCodeEditor();
    if (!editor) return;

    await executeSafely(() => execute(editor));
  };
}

export function createCommand__NEW(execute: Refactoring__NEW) {
  return async (maybeEditor: VSCodeEditor | undefined) => {
    const editor = maybeEditor ?? createVSCodeEditor();
    if (!editor) return;

    await executeSafely(() => executeRefactoring(execute, editor));
  };
}

async function executeRefactoring(
  refactor: Refactoring__NEW,
  editor: VSCodeEditor,
  state: RefactoringState = {
    state: "new",
    code: editor.code,
    selection: editor.selection
  }
) {
  const result = refactor(state);

  switch (result.action) {
    case "do nothing":
      break;

    case "show error":
      editor.showError(result.reason);
      break;

    case "write":
      await editor.write(result.code);
      break;

    case "delegate": {
      const delegateResult = await editor.delegate(result.command);
      if (delegateResult === "not supported") {
        return executeRefactoring(refactor, editor, {
          state: "command not supported",
          code: state.code,
          selection: state.selection
        });
      }
      break;
    }

    case "ask user": {
      const userInput = await editor.askUserInput(result.value);
      return executeRefactoring(refactor, editor, {
        state: "user response",
        value: userInput,
        code: state.code,
        selection: state.selection
      });
    }

    default: {
      const exhaustiveCheck: never = result;
      console.error(`Unhandled type: ${exhaustiveCheck}`);
      break;
    }
  }
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
