import * as vscode from "vscode";

import { WritableEditor, Update } from "../i-write-updates";
import { Position } from "../position";
import { Selection } from "../selection";

export { WritableVSCode };

class WritableVSCode implements WritableEditor {
  private _document: vscode.TextDocument;

  constructor(document: vscode.TextDocument) {
    this._document = document;
  }

  async write(updates: Update[]) {
    const textEdits = updates.map(({ code, selection }) => {
      const startPosition = toVSCodePosition(selection.start);
      const endPosition = toVSCodePosition(selection.end);

      return new vscode.TextEdit(
        new vscode.Range(startPosition, endPosition),
        code
      );
    });

    const edit = new vscode.WorkspaceEdit();
    edit.set(this._document.uri, textEdits);

    await vscode.workspace.applyEdit(edit);
  }

  read(selection: Selection) {
    const startPosition = toVSCodePosition(selection.start);
    const endPosition = toVSCodePosition(selection.end);

    return this._document.getText(new vscode.Range(startPosition, endPosition));
  }
}

function toVSCodePosition(position: Position): vscode.Position {
  return new vscode.Position(position.line, position.character);
}
