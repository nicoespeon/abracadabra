import * as vscode from "vscode";

import { renameSymbol } from "./refactorings/rename-symbol";
import {
  extractVariable,
  canBeExtractedAsVariable
} from "./refactorings/extract-variable";
import { Selection } from "./refactorings/selection";

import { delegateToVSCode } from "./refactorings/adapters/delegate-to-vscode";
import { showErrorMessageInVSCode } from "./refactorings/adapters/show-error-message-in-vscode";
import { WritableVSCode } from "./refactorings/adapters/writable-vscode";

// String values must match `command` fields in `package.json`
enum Refactoring {
  RenameSymbol = "refactorix.renameSymbol",
  ExtractVariable = "refactorix.extractVariable"
}

export function activate(context: vscode.ExtensionContext) {
  const renameSymbolCommand = vscode.commands.registerCommand(
    Refactoring.RenameSymbol,
    () => executeSafely(() => renameSymbol(delegateToVSCode))
  );
  context.subscriptions.push(renameSymbolCommand);

  const extractVariableCommand = vscode.commands.registerCommand(
    Refactoring.ExtractVariable,
    async () => {
      const activeTextEditor = vscode.window.activeTextEditor;
      if (!activeTextEditor) {
        return;
      }

      const { document, selection } = activeTextEditor;

      await executeSafely(() =>
        extractVariable(
          document.getText(),
          createSelectionFromVSCode(selection),
          new WritableVSCode(document),
          delegateToVSCode,
          showErrorMessageInVSCode
        )
      );
    }
  );
  context.subscriptions.push(extractVariableCommand);

  const extractVariableActionProviderJS = vscode.languages.registerCodeActionsProvider(
    "javascript",
    new ExtractVariableActionProvider(),
    {
      providedCodeActionKinds: [ExtractVariableActionProvider.kind]
    }
  );
  const extractVariableActionProviderJSX = vscode.languages.registerCodeActionsProvider(
    "javascriptreact",
    new ExtractVariableActionProvider(),
    {
      providedCodeActionKinds: [ExtractVariableActionProvider.kind]
    }
  );
  const extractVariableActionProviderTS = vscode.languages.registerCodeActionsProvider(
    "typescript",
    new ExtractVariableActionProvider(),
    {
      providedCodeActionKinds: [ExtractVariableActionProvider.kind]
    }
  );
  const extractVariableActionProviderTSX = vscode.languages.registerCodeActionsProvider(
    "typescriptreact",
    new ExtractVariableActionProvider(),
    {
      providedCodeActionKinds: [ExtractVariableActionProvider.kind]
    }
  );
  context.subscriptions.push(
    extractVariableActionProviderJS,
    extractVariableActionProviderJSX,
    extractVariableActionProviderTS,
    extractVariableActionProviderTSX
  );
}

export function deactivate() {}

async function executeSafely(command: () => Promise<any>): Promise<void> {
  try {
    await command();
  } catch (err) {
    if (err.name === "Canceled") {
      // This happens when "Rename Symbol" is completed.
      // In general, if command is cancelled, we're fine to ignore the error.
      return;
    }

    console.error(err);
  }
}

class ExtractVariableActionProvider implements vscode.CodeActionProvider {
  public static readonly kind = vscode.CodeActionKind.RefactorExtract.append(
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
      ExtractVariableActionProvider.kind
    );
    extractVariableAction.isPreferred = true;
    extractVariableAction.command = {
      command: Refactoring.ExtractVariable,
      title: "Extract Variable"
    };

    return [extractVariableAction];
  }
}

function createSelectionFromVSCode(
  selection: vscode.Selection | vscode.Range
): Selection {
  return new Selection(
    [selection.start.line, selection.start.character],
    [selection.end.line, selection.end.character]
  );
}
