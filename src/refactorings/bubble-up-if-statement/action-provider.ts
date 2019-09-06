import * as vscode from "vscode";

import {
  CodeActionProvider,
  createActionProviderFor
} from "../../action-providers";
import { createSelectionFromVSCode } from "../../editor/adapters/vscode-editor";

import { commandKey } from "./command";
import { canBubbleUpIfStatement } from "./bubble-up-if-statement";

class BubbleUpIfStatementActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    if (!canBubbleUpIfStatement(code, selection)) return;

    const action = new vscode.CodeAction(
      "✨ Bubble up if statement",
      this.kind
    );
    action.isPreferred = true;
    action.command = {
      command: commandKey,
      title: "Bubble Up If Statement"
    };

    return [action];
  }
}

export default createActionProviderFor(new BubbleUpIfStatementActionProvider());
