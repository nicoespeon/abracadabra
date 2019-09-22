import * as vscode from "vscode";

import {
  CodeActionProvider,
  createActionProviderFor
} from "../../action-providers";
import { createSelectionFromVSCode } from "../../editor/adapters/vscode-editor";

import { commandKey } from "./command";
import { hasDeadCode } from "./remove-dead-code";

class RemoveDeadCodeActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    if (!hasDeadCode(code, selection)) return;

    const action = new vscode.CodeAction("✨ Remove dead code", this.kind);
    action.isPreferred = true;
    action.command = {
      command: commandKey,
      title: "Remove Dead Code"
    };

    return [action];
  }
}

export default createActionProviderFor(new RemoveDeadCodeActionProvider());
