import * as vscode from "vscode";

import {
  CodeActionProvider,
  createActionProviderFor
} from "../../action-providers";
import { createSelectionFromVSCode } from "../../editor/adapters/vscode-editor";

import { commandKey } from "./command";
import { canMergeWithPreviousIf } from "./merge-with-previous-if-statement";

class MergeWithPreviousIfStatementActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    if (!canMergeWithPreviousIf(code, selection)) return;

    const action = new vscode.CodeAction(
      "✨ Merge with previous if",
      this.kind
    );
    action.isPreferred = true;
    action.command = {
      command: commandKey,
      title: "Merge With Previous If Statement"
    };

    return [action];
  }
}

export default createActionProviderFor(
  new MergeWithPreviousIfStatementActionProvider()
);
