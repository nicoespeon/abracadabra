import * as vscode from "vscode";

import { WriteUpdates, Position } from "../i-write-updates";

export { createWriteUpdatesToVSCode };

function createWriteUpdatesToVSCode(uri: vscode.Uri): WriteUpdates {
  return async updates => {
    const textEdits = updates.map(({ code, selection }) => {
      const startPosition = toVSCodePosition(selection.start);
      const endPosition = toVSCodePosition(selection.end);

      return new vscode.TextEdit(
        new vscode.Range(startPosition, endPosition),
        code
      );
    });

    const edit = new vscode.WorkspaceEdit();
    edit.set(uri, textEdits);

    await vscode.workspace.applyEdit(edit);
  };
}

function toVSCodePosition(position: Position): vscode.Position {
  return new vscode.Position(position.line, position.character);
}
