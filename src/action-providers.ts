import * as vscode from "vscode";

import { RefactoringCommand } from "./refactoring-command";

import { findNegatableExpression } from "./refactorings/negate-expression";
import { hasRedundantElse } from "./refactorings/remove-redundant-else";
import { hasIfElseToFlip } from "./refactorings/flip-if-else";
import { hasTernaryToFlip } from "./refactorings/flip-ternary";

import { createSelectionFromVSCode } from "./editor/adapters/write-code-in-vscode";

export {
  createActionProvidersFor,
  CodeActionProvider,
  createActionProviderFor
};

interface CodeActionProvider extends vscode.CodeActionProvider {
  readonly kind: vscode.CodeActionKind;
}

function createActionProvidersFor(selector: vscode.DocumentSelector) {
  return [
    createActionProviderFor(new NegateExpressionActionProvider())(selector),
    createActionProviderFor(new RemoveRedundantElseActionProvider())(selector),
    createActionProviderFor(new FlipIfElseActionProvider())(selector),
    createActionProviderFor(new FlipTernaryActionProvider())(selector)
  ];
}

function createActionProviderFor(
  actionProvider: CodeActionProvider
): (selector: vscode.DocumentSelector) => vscode.Disposable {
  return selector =>
    vscode.languages.registerCodeActionsProvider(selector, actionProvider, {
      providedCodeActionKinds: [actionProvider.kind]
    });
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
      command: RefactoringCommand.NegateExpression,
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
      command: RefactoringCommand.RemoveRedundantElse,
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
      command: RefactoringCommand.FlipIfElse,
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
      command: RefactoringCommand.FlipTernary,
      title: "Flip Ternary"
    };

    return [action];
  }
}
