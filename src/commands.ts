import * as vscode from "vscode";

import { RefactoringCommand } from "./refactoring-command";

import { renameSymbol } from "./refactorings/rename-symbol";
import { extractVariable } from "./refactorings/extract-variable";
import { inlineVariable } from "./refactorings/inline-variable";
import { negateExpression } from "./refactorings/negate-expression";
import { removeRedundantElse } from "./refactorings/remove-redundant-else";
import { flipIfElse } from "./refactorings/flip-if-else";
import { flipTernary } from "./refactorings/flip-ternary";
import { convertIfElseToTernary } from "./refactorings/convert-if-else-to-ternary";
import { convertTernaryToIfElse } from "./refactorings/convert-ternary-to-if-else";
import { Refactoring } from "./refactorings/refactoring";

import { delegateToVSCode } from "./refactorings/adapters/delegate-to-vscode";
import { showErrorMessageInVSCode } from "./refactorings/adapters/show-error-message-in-vscode";
import {
  createReadThenWriteInVSCode,
  createWriteInVSCode
} from "./refactorings/adapters/write-code-in-vscode";
import { createSelectionFromVSCode } from "./refactorings/adapters/selection-from-vscode";

export default [
  vscode.commands.registerCommand(
    RefactoringCommand.RenameSymbol,
    renameSymbolCommand
  ),
  vscode.commands.registerCommand(
    RefactoringCommand.ExtractVariable,
    extractVariableCommand
  ),
  vscode.commands.registerCommand(
    RefactoringCommand.InlineVariable,
    inlineVariableCommand
  ),
  vscode.commands.registerCommand(
    RefactoringCommand.NegateExpression,
    negateExpressionCommand
  ),
  vscode.commands.registerCommand(
    RefactoringCommand.RemoveRedundantElse,
    createCommand(removeRedundantElse)
  ),
  vscode.commands.registerCommand(
    RefactoringCommand.FlipIfElse,
    createCommand(flipIfElse)
  ),
  vscode.commands.registerCommand(
    RefactoringCommand.FlipTernary,
    createCommand(flipTernary)
  ),
  vscode.commands.registerCommand(
    RefactoringCommand.ConvertIfElseToTernary,
    createCommand(convertIfElseToTernary)
  ),
  vscode.commands.registerCommand(
    RefactoringCommand.ConvertTernaryToIfElse,
    createCommand(convertTernaryToIfElse)
  )
];

function renameSymbolCommand() {
  executeSafely(() => renameSymbol(delegateToVSCode));
}

async function extractVariableCommand() {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    return;
  }

  const { document, selection } = activeTextEditor;

  await executeSafely(() =>
    extractVariable(
      document.getText(),
      createSelectionFromVSCode(selection),
      createReadThenWriteInVSCode(document),
      delegateToVSCode,
      showErrorMessageInVSCode
    )
  );
}

async function inlineVariableCommand() {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    return;
  }

  const { document, selection } = activeTextEditor;

  await executeSafely(() =>
    inlineVariable(
      document.getText(),
      createSelectionFromVSCode(selection),
      createReadThenWriteInVSCode(document),
      showErrorMessageInVSCode
    )
  );
}

async function negateExpressionCommand() {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    return;
  }

  const { document, selection } = activeTextEditor;

  await executeSafely(() =>
    negateExpression(
      document.getText(),
      createSelectionFromVSCode(selection),
      createReadThenWriteInVSCode(document),
      showErrorMessageInVSCode
    )
  );
}

function createCommand(refactoring: Refactoring) {
  return async () => {
    const activeTextEditor = vscode.window.activeTextEditor;
    if (!activeTextEditor) {
      return;
    }

    const { document, selection } = activeTextEditor;

    await executeSafely(() =>
      refactoring(
        document.getText(),
        createSelectionFromVSCode(selection),
        createWriteInVSCode(document),
        showErrorMessageInVSCode
      )
    );
  };
}

async function executeSafely(command: () => Promise<any>): Promise<void> {
  try {
    await command();
  } catch (err) {
    if (err.name === "Canceled") {
      // This happens when "Rename Symbol" is completed.
      // In general, if command is cancelled, we're fine to ignore the error.
      return;
    }

    vscode.window.showErrorMessage(
      `😅 I'm sorry, something went wrong: ${err.message}`
    );
    console.error(err);
  }
}
