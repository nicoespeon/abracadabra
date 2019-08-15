import * as vscode from "vscode";

import {
  CodeActionProvider,
  createActionProviderFor
} from "../../action-providers";
import { createSelectionFromVSCode } from "../../editor/adapters/vscode-editor";

import { commandKey } from "./command";
import { hasBracesToRemoveFromArrowFunction } from "./remove-braces-from-arrow-function";

class RemoveBracesFromArrowFunctionActionProvider
  implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    if (!hasBracesToRemoveFromArrowFunction(code, selection)) return;

    const action = new vscode.CodeAction(
      "✨ Remove braces from arrow function",
      this.kind
    );
    action.isPreferred = false;
    action.command = {
      command: commandKey,
      title: "Remove Braces from Arrow Function"
    };

    return [action];
  }
}

export default createActionProviderFor(
  new RemoveBracesFromArrowFunctionActionProvider()
);
