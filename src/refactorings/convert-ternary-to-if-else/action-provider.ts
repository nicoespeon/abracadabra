import * as vscode from "vscode";

import {
  CodeActionProvider,
  createActionProviderFor
} from "../../action-providers";
import { createSelectionFromVSCode } from "../../editor/adapters/write-code-in-vscode";

import { commandKey } from "./command";
import { hasTernaryToConvert } from "./convert-ternary-to-if-else";

class ConvertTernaryToIfElseActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    if (!hasTernaryToConvert(code, selection)) return;

    const action = new vscode.CodeAction(
      "✨ Convert ternary to if/else",
      this.kind
    );
    action.isPreferred = false;
    action.command = {
      command: commandKey,
      title: "Convert Ternary to If/Else"
    };

    return [action];
  }
}

export default createActionProviderFor(
  new ConvertTernaryToIfElseActionProvider()
);
