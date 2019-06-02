import * as vscode from "vscode";

import { WriteUpdates, GetCode } from "../i-write-updates";
import { Position } from "../position";

export { createWriteUpdatesToVSCode, createGetCodeFromVSCode };

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

function createGetCodeFromVSCode(document: vscode.TextDocument): GetCode {
  return selection => {
    const startPosition = toVSCodePosition(selection.start);
    const endPosition = toVSCodePosition(selection.end);

    return document.getText(new vscode.Range(startPosition, endPosition));
  };
}
function toVSCodePosition(position: Position): vscode.Position {
  return new vscode.Position(position.line, position.character);
}
