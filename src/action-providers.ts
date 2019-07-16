import * as vscode from "vscode";

export { CodeActionProvider, createActionProviderFor };

interface CodeActionProvider extends vscode.CodeActionProvider {
  readonly kind: vscode.CodeActionKind;
}

function createActionProviderFor(
  actionProvider: CodeActionProvider
): (selector: vscode.DocumentSelector) => vscode.Disposable {
  return selector =>
    vscode.languages.registerCodeActionsProvider(selector, actionProvider, {
      providedCodeActionKinds: [actionProvider.kind]
    });
}
