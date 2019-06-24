import * as vscode from "vscode";

import { Refactoring } from "./refactoring";

import { findNegatableExpression } from "./refactorings/negate-expression";
import { hasRedundantElse } from "./refactorings/remove-redundant-else";
import { hasIfElseToFlip } from "./refactorings/flip-if-else";
import { hasTernaryToFlip } from "./refactorings/flip-ternary";
import { hasIfElseToConvert } from "./refactorings/convert-if-else-to-ternary";

import { createSelectionFromVSCode } from "./refactorings/adapters/selection-from-vscode";

export { createActionProvidersFor };

interface ActionProviders {
  negateExpression: vscode.Disposable;
  removeRedundantElse: vscode.Disposable;
  flipIfElse: vscode.Disposable;
  flipTernary: vscode.Disposable;
  convertIfElseToTernary: vscode.Disposable;
}

interface CodeActionProvider extends vscode.CodeActionProvider {
  readonly kind: vscode.CodeActionKind;
}

function createActionProvidersFor(
  selector: vscode.DocumentSelector
): ActionProviders {
  return {
    negateExpression: createActionProvider(
      new NegateExpressionActionProvider()
    ),
    removeRedundantElse: createActionProvider(
      new RemoveRedundantElseActionProvider()
    ),
    flipIfElse: createActionProvider(new FlipIfElseActionProvider()),
    flipTernary: createActionProvider(new FlipTernaryActionProvider()),
    convertIfElseToTernary: createActionProvider(
      new ConvertIfElseToTernaryActionProvider()
    )
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

    let actionText = "✨ Negate the expression";
    if (expression.negatedOperator) {
      actionText += ` (use ${expression.negatedOperator} instead)`;
    }

    const action = new vscode.CodeAction(actionText, this.kind);
    action.isPreferred = false;
    action.command = {
      command: Refactoring.NegateExpression,
      title: "Negate Expression"
    };

    return [action];
  }
}

class RemoveRedundantElseActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    if (!hasRedundantElse(code, selection)) return;

    const action = new vscode.CodeAction("✨ Remove redundant else", this.kind);
    action.isPreferred = true;
    action.command = {
      command: Refactoring.RemoveRedundantElse,
      title: "Remove Redundant Else"
    };

    return [action];
  }
}

class FlipIfElseActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    if (!hasIfElseToFlip(code, selection)) return;

    const action = new vscode.CodeAction("✨ Flip if/else", this.kind);
    action.isPreferred = true;
    action.command = {
      command: Refactoring.FlipIfElse,
      title: "Flip If/Else"
    };

    return [action];
  }
}

class FlipTernaryActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    if (!hasTernaryToFlip(code, selection)) return;

    const action = new vscode.CodeAction("✨ Flip ternary", this.kind);
    action.isPreferred = true;
    action.command = {
      command: Refactoring.FlipTernary,
      title: "Flip Ternary"
    };

    return [action];
  }
}

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
      command: Refactoring.ConvertIfElseToTernary,
      title: "Convert If/Else to Ternary"
    };

    return [action];
  }
}
