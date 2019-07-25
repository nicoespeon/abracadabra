import * as vscode from "vscode";

import {
  CodeActionProvider,
  createActionProviderFor
} from "../../action-providers";
import { createSelectionFromVSCode } from "../../editor/adapters/write-code-in-vscode";

import { commandKey } from "./command";
import { canMergeIfStatements } from "./merge-if-statements";

class MergeIfStatementsActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    if (!canMergeIfStatements(code, selection)) return;

    const action = new vscode.CodeAction("✨ Merge if statements", this.kind);
    action.isPreferred = false;
    action.command = {
      command: commandKey,
      title: "Merge If Statements"
    };

    return [action];
  }
}

export default createActionProviderFor(new MergeIfStatementsActionProvider());
