import * as vscode from "vscode";

import { Refactoring } from "./refactoring";

import { findNegatableExpression } from "./refactorings/negate-expression";

import { createSelectionFromVSCode } from "./refactorings/adapters/selection-from-vscode";

export { createActionProvidersFor };

interface ActionProviders {
  negateExpression: vscode.Disposable;
}

interface CodeActionProvider extends vscode.CodeActionProvider {
  readonly kind: vscode.CodeActionKind;
}

function createActionProvidersFor(
  selector: vscode.DocumentSelector
): ActionProviders {
  return {
    negateExpression: createActionProvider(new NegateExpressionActionProvider())
  };

  function createActionProvider(
    actionProvider: CodeActionProvider
  ): vscode.Disposable {
    return vscode.languages.registerCodeActionsProvider(
      selector,
      actionProvider,
      {
        providedCodeActionKinds: [actionProvider.kind]
      }
    );
  }
}

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

    let actionText = "Negate the expression";
    if (expression.negatedOperator) {
      actionText += ` (use ${expression.negatedOperator} instead)`;
    }

    const negateExpressionAction = new vscode.CodeAction(actionText, this.kind);
    negateExpressionAction.isPreferred = true;
    negateExpressionAction.command = {
      command: Refactoring.NegateExpression,
      title: "Negate Expression"
    };

    return [negateExpressionAction];
  }
}
