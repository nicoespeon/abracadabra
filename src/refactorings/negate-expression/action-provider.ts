import * as vscode from "vscode";

import {
  CodeActionProvider,
  createActionProviderFor
} from "../../action-providers";
import { createSelectionFromVSCode } from "../../editor/adapters/vscode-editor";

import { commandKey } from "./command";
import { findNegatableExpression } from "./negate-expression";

class NegateExpressionActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    const expression = findNegatableExpression(code, selection);
    if (!expression) return;

    let actionText = "✨ Negate the expression";
    if (expression.negatedOperator) {
      actionText += ` (use ${expression.negatedOperator} instead)`;
    }

    const action = new vscode.CodeAction(actionText, this.kind);
    action.isPreferred = false;
    action.command = {
      command: commandKey,
      title: "Negate Expression"
    };

    return [action];
  }
}

export default createActionProviderFor(new NegateExpressionActionProvider());
