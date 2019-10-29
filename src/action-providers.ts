import * as vscode from "vscode";

import { createSelectionFromVSCode } from "./editor/adapters/vscode-editor";
import { Code } from "./editor/editor";
import { Selection } from "./editor/selection";

export {
  CodeActionProvider,
  RefactoringActionProvider,
  createActionProviderFor
};

interface CodeActionProvider extends vscode.CodeActionProvider {
  readonly kind: vscode.CodeActionKind;
}

class RefactoringActionProvider implements CodeActionProvider {
  readonly kind = vscode.CodeActionKind.RefactorRewrite;
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

    const action = new vscode.CodeAction(`✨ ${this.actionMessage}`, this.kind);
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

function createActionProviderFor(
  actionProvider: CodeActionProvider
): (selector: vscode.DocumentSelector) => vscode.Disposable {
  return selector =>
    vscode.languages.registerCodeActionsProvider(selector, actionProvider, {
      providedCodeActionKinds: [actionProvider.kind]
    });
}
