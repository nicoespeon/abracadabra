import * as vscode from "vscode";

import {
  CodeActionProvider,
  createActionProviderFor
} from "../../action-providers";
import { createSelectionFromVSCode } from "../../editor/adapters/write-code-in-vscode";

import { commandKey } from "./command";
import { hasRedundantElse } from "./remove-redundant-else";

class RemoveRedundantElseActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    if (!hasRedundantElse(code, selection)) return;

    const action = new vscode.CodeAction("✨ Remove redundant else", this.kind);
    action.isPreferred = true;
    action.command = {
      command: commandKey,
      title: "Remove Redundant Else"
    };

    return [action];
  }
}

export default createActionProviderFor(new RemoveRedundantElseActionProvider());
