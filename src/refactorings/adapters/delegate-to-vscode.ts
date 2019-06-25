import * as vscode from "vscode";

import {
  DelegateToEditor,
  EditorCommand
} from "../editor/i-delegate-to-editor";

let delegateToVSCode: DelegateToEditor;
export { delegateToVSCode };

delegateToVSCode = async command => {
  await vscode.commands.executeCommand(toVSCodeCommand(command));
};

function toVSCodeCommand(command: EditorCommand): string {
  switch (command) {
    case EditorCommand.RenameSymbol:
      return "editor.action.rename";

    default:
      return "";
  }
}
