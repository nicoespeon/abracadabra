import * as vscode from "vscode";

import { DelegateToEditor, EditorCommand } from "../i-delegate-to-editor";

let delegateToVSCode: DelegateToEditor;
export { delegateToVSCode };

delegateToVSCode = command => {
  vscode.commands.executeCommand(toVSCodeCommand(command));
};

function toVSCodeCommand(command: EditorCommand): string {
  switch (command) {
    case EditorCommand.RenameSymbol:
      return "editor.action.rename";

    default:
      return "";
  }
}
