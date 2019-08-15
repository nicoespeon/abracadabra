import * as vscode from "vscode";

import {
  CodeActionProvider,
  createActionProviderFor
} from "../../action-providers";
import { createSelectionFromVSCode } from "../../editor/adapters/vscode-editor";

import { commandKey } from "./command";
import { hasIfElseToConvert } from "./convert-if-else-to-ternary";

class ConvertIfElseToTernaryActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    if (!hasIfElseToConvert(code, selection)) return;

    const action = new vscode.CodeAction(
      "✨ Convert if/else to ternary",
      this.kind
    );
    action.isPreferred = false;
    action.command = {
      command: commandKey,
      title: "Convert If/Else to Ternary"
    };

    return [action];
  }
}

export default createActionProviderFor(
  new ConvertIfElseToTernaryActionProvider()
);
