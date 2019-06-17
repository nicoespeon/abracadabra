import * as vscode from "vscode";
import { Pipe } from "ts-functionaltypes";

import { UpdateWith, Write, Update } from "../i-update-code";
import { Position } from "../position";
import { Selection } from "../selection";

export { createUpdateWithInVSCode, createWriteInVSCode };

const pipe: Pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

function createWriteInVSCode(document: vscode.TextDocument): Write {
  return async function write(updates: Update[]) {
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
  };
}

function createUpdateWithInVSCode(document: vscode.TextDocument): UpdateWith {
  return async (selection, getUpdates) =>
    pipe(
      read,
      getUpdates,
      createWriteInVSCode(document)
    )(selection);

  function read(selection: Selection) {
    const startPosition = toVSCodePosition(selection.start);
    const endPosition = toVSCodePosition(selection.end);

    return document.getText(new vscode.Range(startPosition, endPosition));
  }
}

function toVSCodePosition(position: Position): vscode.Position {
  return new vscode.Position(position.line, position.character);
}
