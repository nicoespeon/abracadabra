import * as vscode from "vscode";

import { RefactoringCommand } from "./refactoring-command";

import { findNegatableExpression } from "./refactorings/negate-expression";
import { hasRedundantElse } from "./refactorings/remove-redundant-else";
import { hasIfElseToFlip } from "./refactorings/flip-if-else";
import { hasTernaryToFlip } from "./refactorings/flip-ternary";
import { hasIfElseToConvert } from "./refactorings/convert-if-else-to-ternary";
import { hasTernaryToConvert } from "./refactorings/convert-ternary-to-if-else";

import { createSelectionFromVSCode } from "./refactorings/editor/adapters/write-code-in-vscode";

export { createActionProvidersFor };

interface CodeActionProvider extends vscode.CodeActionProvider {
  readonly kind: vscode.CodeActionKind;
}

function createActionProvidersFor(selector: vscode.DocumentSelector) {
  return [
    createActionProvider(new NegateExpressionActionProvider()),
    createActionProvider(new RemoveRedundantElseActionProvider()),
    createActionProvider(new FlipIfElseActionProvider()),
    createActionProvider(new FlipTernaryActionProvider()),
    createActionProvider(new ConvertIfElseToTernaryActionProvider()),
    createActionProvider(new ConvertTernaryToIfElseActionProvider())
  ];

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
      command: RefactoringCommand.ConvertIfElseToTernary,
      title: "Convert If/Else to Ternary"
    };

    return [action];
  }
}

class ConvertTernaryToIfElseActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorRewrite;

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    if (!hasTernaryToConvert(code, selection)) return;

    const action = new vscode.CodeAction(
      "✨ Convert ternary to if/else",
      this.kind
    );
    action.isPreferred = false;
    action.command = {
      command: RefactoringCommand.ConvertTernaryToIfElse,
      title: "Convert Ternary to If/Else"
    };

    return [action];
  }
}
