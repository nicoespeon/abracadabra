import * as vscode from "vscode";

import {
  CodeActionProvider,
  createActionProviderFor
} from "../../action-providers";
import { createSelectionFromVSCode } from "../../editor/adapters/vscode-editor";

import { commandKey } from "./command";
import { canConvertForLoop } from "./convert-for-to-foreach";

class ConvertForToForeachActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    if (!canConvertForLoop(code, selection)) return;

    const action = new vscode.CodeAction(
      "✨ Convert for to foreach",
      this.kind
    );
    action.isPreferred = true;
    action.command = {
      command: commandKey,
      title: "Convert For To Foreach"
    };

    return [action];
  }
}

export default createActionProviderFor(new ConvertForToForeachActionProvider());
