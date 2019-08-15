import * as vscode from "vscode";

import {
  CodeActionProvider,
  createActionProviderFor
} from "../../action-providers";
import { createSelectionFromVSCode } from "../../editor/adapters/vscode-editor";

import { commandKey } from "./command";
import { canConvertToTemplateLiteral } from "./convert-to-template-literal";

class ConvertToTemplateLiteralActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    if (!canConvertToTemplateLiteral(code, selection)) return;

    const action = new vscode.CodeAction(
      "✨ Convert to template literal",
      this.kind
    );
    action.isPreferred = true;
    action.command = {
      command: commandKey,
      title: "Convert to Template Literal"
    };

    return [action];
  }
}

export default createActionProviderFor(
  new ConvertToTemplateLiteralActionProvider()
);
