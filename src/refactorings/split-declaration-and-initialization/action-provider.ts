import * as vscode from "vscode";

import {
  CodeActionProvider,
  createActionProviderFor
} from "../../action-providers";
import { createSelectionFromVSCode } from "../../editor/adapters/write-code-in-vscode";

import { commandKey } from "./command";
import { canSplitDeclarationAndInitialization } from "./split-declaration-and-initialization";

class SplitDeclarationAndInitializationActionProvider
  implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    if (!canSplitDeclarationAndInitialization(code, selection)) return;

    const action = new vscode.CodeAction(
      "✨ Replace with 'let', split declaration and initialization",
      this.kind
    );
    action.isPreferred = false;
    action.command = {
      command: commandKey,
      title: "Split Declaration and Initialization"
    };

    return [action];
  }
}

export default createActionProviderFor(
  new SplitDeclarationAndInitializationActionProvider()
);
