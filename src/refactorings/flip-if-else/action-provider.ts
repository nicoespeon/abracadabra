import * as vscode from "vscode";

import {
  CodeActionProvider,
  createActionProviderFor
} from "../../action-providers";
import { createSelectionFromVSCode } from "../../editor/adapters/vscode-editor";

import { commandKey } from "./command";
import { hasIfElseToFlip } from "./flip-if-else";

class FlipIfElseActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    if (!hasIfElseToFlip(code, selection)) return;

    const action = new vscode.CodeAction("✨ Flip if/else", this.kind);
    action.isPreferred = true;
    action.command = {
      command: commandKey,
      title: "Flip If/Else"
    };

    return [action];
  }
}

export default createActionProviderFor(new FlipIfElseActionProvider());
