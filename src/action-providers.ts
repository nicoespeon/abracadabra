import * as vscode from "vscode";

import { Refactoring } from "./refactoring";

import { canBeExtractedAsVariable } from "./refactorings/extract-variable";

import { createSelectionFromVSCode } from "./refactorings/adapters/selection-from-vscode";

export { createActionProvidersFor };

interface ActionProviders {
  extractVariable: vscode.Disposable;
}

interface CodeActionProvider extends vscode.CodeActionProvider {
  readonly kind: vscode.CodeActionKind;
}

function createActionProvidersFor(
  selector: vscode.DocumentSelector
): ActionProviders {
  return {
    extractVariable: createActionProvider(new ExtractVariableActionProvider())
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

class ExtractVariableActionProvider implements CodeActionProvider {
  public readonly kind = vscode.CodeActionKind.RefactorExtract.append(
    "variable"
  );

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const code = document.getText();
    const selection = createSelectionFromVSCode(range);
    if (!canBeExtractedAsVariable(code, selection)) return;

    const extractVariableAction = new vscode.CodeAction(
      `Extract in a variable`,
      this.kind
    );
    extractVariableAction.isPreferred = true;
    extractVariableAction.command = {
      command: Refactoring.ExtractVariable,
      title: "Extract Variable"
    };

    return [extractVariableAction];
  }
}
