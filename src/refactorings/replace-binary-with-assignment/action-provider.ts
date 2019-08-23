import * as vscode from "vscode";

import {
  CodeActionProvider,
  createActionProviderFor
} from "../../action-providers";
import { createSelectionFromVSCode } from "../../editor/adapters/vscode-editor";

import { commandKey } from "./command";
import { tryToReplaceBinaryWithAssignment } from "./replace-binary-with-assignment";

class ReplaceBinaryWithAssignmentActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    const attempt = tryToReplaceBinaryWithAssignment(code, selection);
    if (!attempt.canReplace) return;

    const action = new vscode.CodeAction(
      `✨ Replace = with ${attempt.operator}=`,
      this.kind
    );
    action.isPreferred = true;
    action.command = {
      command: commandKey,
      title: "Replace Binary With Assignment"
    };

    return [action];
  }
}

export default createActionProviderFor(
  new ReplaceBinaryWithAssignmentActionProvider()
);
