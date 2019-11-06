import * as vscode from "vscode";

import { createSelectionFromVSCode } from "./editor/adapters/vscode-editor";
import { Code } from "./editor/editor";
import { Selection } from "./editor/selection";
import { RefactoringWithActionProvider } from "./types";

export {
  CodeActionProvider,
  RefactoringActionProvider,
  xxxnew_RefactoringActionProvider,
  createActionProviderFor
};

interface CodeActionProvider extends vscode.CodeActionProvider {}

class RefactoringActionProvider implements CodeActionProvider {
  actionMessage = "";
  commandKey = "";
  title = "";
  isPreferred = false;

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    let canPerformRefactoring = false;
    try {
      canPerformRefactoring = this.canPerformRefactoring(code, selection);
    } catch (_) {
      // Silently fail so it stops here (e.g. code can't be parsed)
    }

    if (!canPerformRefactoring) return;

    const action = new vscode.CodeAction(
      `✨ ${this.actionMessage}`,
      vscode.CodeActionKind.RefactorRewrite
    );
    action.isPreferred = this.isPreferred;
    action.command = {
      command: this.commandKey,
      title: this.title
    };

    return [action];
  }

  canPerformRefactoring(_code: Code, _selection: Selection): boolean {
    return false;
  }
}

class xxxnew_RefactoringActionProvider implements CodeActionProvider {
  private refactorings: RefactoringWithActionProvider[];

  constructor(refactorings: RefactoringWithActionProvider[]) {
    this.refactorings = refactorings;
  }

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);

    return this.refactorings
      .filter(refactoring => this.canPerform(refactoring, code, selection))
      .map(refactoring => this.buildCodeActionFor(refactoring));
  }

  private canPerform(
    refactoring: RefactoringWithActionProvider,
    code: Code,
    selection: Selection
  ) {
    try {
      return refactoring.canPerformRefactoring(code, selection);
    } catch (_) {
      // Silently fail, we don't care why it failed (e.g. code can't be parsed).
      return false;
    }
  }

  private buildCodeActionFor(refactoring: RefactoringWithActionProvider) {
    const action = new vscode.CodeAction(
      `✨ ${refactoring.actionProviderMessage}`,
      vscode.CodeActionKind.RefactorRewrite
    );

    action.isPreferred = refactoring.isPreferred;
    action.command = {
      command: refactoring.commandKey,
      title: refactoring.title
    };

    return action;
  }
}

function createActionProviderFor(
  actionProvider: CodeActionProvider
): (selector: vscode.DocumentSelector) => vscode.Disposable {
  return selector =>
    vscode.languages.registerCodeActionsProvider(selector, actionProvider, {
      providedCodeActionKinds: [vscode.CodeActionKind.RefactorRewrite]
    });
}
