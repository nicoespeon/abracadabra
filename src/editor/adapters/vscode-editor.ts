import * as vscode from "vscode";

import {
  Editor,
  Code,
  Update,
  Command,
  ErrorReason,
  errorReasonToString
} from "../editor";
import { Selection } from "../selection";
import { Position } from "../position";

export { VSCodeEditor, createSelectionFromVSCode };

class VSCodeEditor implements Editor {
  private editor: vscode.TextEditor;
  private document: vscode.TextDocument;

  constructor(editor: vscode.TextEditor) {
    this.editor = editor;
    this.document = editor.document;
  }

  async write(code: Code, newCursorPosition?: Position): Promise<void> {
    const cursorAtInitialStartPosition = new vscode.Selection(
      this.editor.selection.start,
      this.editor.selection.start
    );

    const edit = new vscode.WorkspaceEdit();
    const allDocumentRange = new vscode.Range(
      new vscode.Position(0, 0),
      new vscode.Position(this.document.lineCount, 0)
    );

    edit.set(this.document.uri, [new vscode.TextEdit(allDocumentRange, code)]);

    await vscode.workspace.applyEdit(edit);

    this.editor.selection = newCursorPosition
      ? toVSCodeCursor(newCursorPosition)
      : cursorAtInitialStartPosition;
  }

  async readThenWrite(
    selection: Selection,
    getUpdates: (code: Code) => Update[],
    newCursorPosition?: Position
  ): Promise<void> {
    const startPosition = toVSCodePosition(selection.start);
    const endPosition = toVSCodePosition(selection.end);

    const readCode = this.document.getText(
      new vscode.Range(startPosition, endPosition)
    );

    const textEdits = getUpdates(readCode).map(({ code, selection }) => {
      const startPosition = toVSCodePosition(selection.start);
      const endPosition = toVSCodePosition(selection.end);

      return new vscode.TextEdit(
        new vscode.Range(startPosition, endPosition),
        code
      );
    });

    const edit = new vscode.WorkspaceEdit();
    edit.set(this.document.uri, textEdits);

    await vscode.workspace.applyEdit(edit);

    if (newCursorPosition) {
      this.editor.selection = toVSCodeCursor(newCursorPosition);
    }
  }

  async delegate(command: Command) {
    await vscode.commands.executeCommand(toVSCodeCommand(command));
  }

  async showError(reason: ErrorReason) {
    await vscode.window.showErrorMessage(errorReasonToString(reason));
  }
}

function createSelectionFromVSCode(
  selection: vscode.Selection | vscode.Range
): Selection {
  return new Selection(
    [selection.start.line, selection.start.character],
    [selection.end.line, selection.end.character]
  );
}

function toVSCodeCursor(position: Position): vscode.Selection {
  return new vscode.Selection(
    toVSCodePosition(position),
    toVSCodePosition(position)
  );
}

function toVSCodePosition(position: Position): vscode.Position {
  return new vscode.Position(position.line, position.character);
}

function toVSCodeCommand(command: Command): string {
  switch (command) {
    case Command.RenameSymbol:
      return "editor.action.rename";

    default:
      return "";
  }
}
