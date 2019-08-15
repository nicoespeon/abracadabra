import * as vscode from "vscode";

import {
  CodeActionProvider,
  createActionProviderFor
} from "../../action-providers";
import { createSelectionFromVSCode } from "../../editor/adapters/vscode-editor";

import { commandKey } from "./command";
import { hasArrowFunctionToAddBraces } from "./add-braces-to-arrow-function";

class AddBracesToArrowFunctionActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    if (!hasArrowFunctionToAddBraces(code, selection)) return;

    const action = new vscode.CodeAction(
      "✨ Add braces to arrow function",
      this.kind
    );
    action.isPreferred = false;
    action.command = {
      command: commandKey,
      title: "Add Braces to Arrow Function"
    };

    return [action];
  }
}

export default createActionProviderFor(
  new AddBracesToArrowFunctionActionProvider()
);
