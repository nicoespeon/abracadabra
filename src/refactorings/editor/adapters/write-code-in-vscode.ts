import * as vscode from "vscode";
import { Pipe } from "ts-functionaltypes";

import { ReadThenWrite, Update, Write } from "../i-write-code";
import { Position } from "../position";
import { Selection } from "../selection";

export {
  createWriteInVSCode,
  createReadThenWriteInVSCode,
  toVSCodePosition,
  createSelectionFromVSCode
};

const pipe: Pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

function createWriteInVSCode(editor: vscode.TextEditor): Write {
  const { document } = editor;

  return async function write(code, newCursorPosition) {
    const cursorAtInitialStartPosition = new vscode.Selection(
      editor.selection.start,
      editor.selection.start
    );

    const edit = new vscode.WorkspaceEdit();
    const allDocumentRange = new vscode.Range(
      new vscode.Position(0, 0),
      new vscode.Position(document.lineCount, 0)
    );

    edit.set(document.uri, [new vscode.TextEdit(allDocumentRange, code)]);

    await vscode.workspace.applyEdit(edit);

    editor.selection = newCursorPosition
      ? toVSCodeCursor(newCursorPosition)
      : cursorAtInitialStartPosition;
  };
}

function createReadThenWriteInVSCode(
  document: vscode.TextDocument
): ReadThenWrite {
  return async (selection, getUpdates) =>
    pipe(
      read,
      getUpdates,
      write
    )(selection);

  function read(selection: Selection) {
    const startPosition = toVSCodePosition(selection.start);
    const endPosition = toVSCodePosition(selection.end);

    return document.getText(new vscode.Range(startPosition, endPosition));
  }

  async function write(updates: Update[]) {
    const textEdits = updates.map(({ code, selection }) => {
      const startPosition = toVSCodePosition(selection.start);
      const endPosition = toVSCodePosition(selection.end);

      return new vscode.TextEdit(
        new vscode.Range(startPosition, endPosition),
        code
      );
    });

    const edit = new vscode.WorkspaceEdit();
    edit.set(document.uri, textEdits);

    await vscode.workspace.applyEdit(edit);
  }
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

function createSelectionFromVSCode(
  selection: vscode.Selection | vscode.Range
): Selection {
  return new Selection(
    [selection.start.line, selection.start.character],
    [selection.end.line, selection.end.character]
  );
}
