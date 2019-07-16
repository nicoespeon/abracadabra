import * as vscode from "vscode";

import { RefactoringCommand } from "./refactoring-command";

import { renameSymbol } from "./refactorings/rename-symbol";
import { inlineVariable } from "./refactorings/inline-variable";
import { negateExpression } from "./refactorings/negate-expression";
import { removeRedundantElse } from "./refactorings/remove-redundant-else";
import { flipTernary } from "./refactorings/flip-ternary";
import { moveStatementUp } from "./refactorings/move-statement-up";
import { moveStatementDown } from "./refactorings/move-statement-down";
import { Refactoring } from "./refactorings/refactoring";

import { delegateToVSCode } from "./editor/adapters/delegate-to-vscode";
import { showErrorMessageInVSCode } from "./editor/adapters/show-error-message-in-vscode";
import {
  createReadThenWriteInVSCode,
  createWriteInVSCode,
  createSelectionFromVSCode
} from "./editor/adapters/write-code-in-vscode";

export default [
  vscode.commands.registerCommand(
    RefactoringCommand.RenameSymbol,
    renameSymbolCommand
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
    RefactoringCommand.FlipTernary,
    createCommand(flipTernary)
  ),
  vscode.commands.registerCommand(
    RefactoringCommand.MoveStatementUp,
    createCommand(moveStatementUp)
  ),
  vscode.commands.registerCommand(
    RefactoringCommand.MoveStatementDown,
    createCommand(moveStatementDown)
  )
];

function renameSymbolCommand() {
  executeSafely(() => renameSymbol(delegateToVSCode));
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

export function createCommand(refactoring: Refactoring) {
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
        createWriteInVSCode(activeTextEditor),
        showErrorMessageInVSCode
      )
    );
  };
}

export async function executeSafely(
  command: () => Promise<any>
): Promise<void> {
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
