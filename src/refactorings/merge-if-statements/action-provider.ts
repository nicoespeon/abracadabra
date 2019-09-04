import * as vscode from "vscode";

import {
  CodeActionProvider,
  createActionProviderFor
} from "../../action-providers";
import { createSelectionFromVSCode } from "../../editor/adapters/vscode-editor";

import { commandKey } from "./command";
import { tryMergeIfStatements } from "./merge-if-statements";

class MergeIfStatementsActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    const attempt = tryMergeIfStatements(code, selection);
    if (!attempt.canMerge) return;

    const title = attempt.mergeAlternate
      ? "✨ Merge else-if"
      : "✨ Merge if statements";

    const action = new vscode.CodeAction(title, this.kind);
    action.isPreferred = false;
    action.command = {
      command: commandKey,
      title: "Merge If Statements"
    };

    return [action];
  }
}

export default createActionProviderFor(new MergeIfStatementsActionProvider());
