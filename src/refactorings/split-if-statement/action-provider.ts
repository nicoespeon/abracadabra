import * as vscode from "vscode";

import {
  CodeActionProvider,
  createActionProviderFor
} from "../../action-providers";
import { createSelectionFromVSCode } from "../../editor/adapters/write-code-in-vscode";

import { commandKey } from "./command";
import { canSplitIfStatement } from "./split-if-statement";

class SplitIfStatementActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    if (!canSplitIfStatement(code, selection)) return;

    const action = new vscode.CodeAction("✨ Split if statement", this.kind);
    action.isPreferred = false;
    action.command = {
      command: commandKey,
      title: "Split If Statement"
    };

    return [action];
  }
}

export default createActionProviderFor(new SplitIfStatementActionProvider());
