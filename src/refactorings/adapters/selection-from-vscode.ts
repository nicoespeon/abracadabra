import * as vscode from "vscode";

import { Selection } from "../selection";

export { createSelectionFromVSCode };

function createSelectionFromVSCode(
  selection: vscode.Selection | vscode.Range
): Selection {
  return new Selection(
    [selection.start.line, selection.start.character],
    [selection.end.line, selection.end.character]
  );
}
