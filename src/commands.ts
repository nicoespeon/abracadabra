import * as vscode from "vscode";

import { Refactoring } from "./refactoring";

import { renameSymbol } from "./refactorings/rename-symbol";
import { extractVariable } from "./refactorings/extract-variable";
import { inlineVariable } from "./refactorings/inline-variable";
import { negateExpression } from "./refactorings/negate-expression";
import { removeRedundantElse } from "./refactorings/remove-redundant-else";
import { flipIfElse } from "./refactorings/flip-if-else";

import { delegateToVSCode } from "./refactorings/adapters/delegate-to-vscode";
import { showErrorMessageInVSCode } from "./refactorings/adapters/show-error-message-in-vscode";
import {
  createReadThenWriteInVSCode,
  createWriteInVSCode
} from "./refactorings/adapters/write-code-in-vscode";
import { createSelectionFromVSCode } from "./refactorings/adapters/selection-from-vscode";

export default {
  renameSymbol: vscode.commands.registerCommand(
    Refactoring.RenameSymbol,
    renameSymbolCommand
  ),
  extractVariable: vscode.commands.registerCommand(
    Refactoring.ExtractVariable,
    extractVariableCommand
  ),
  inlineVariable: vscode.commands.registerCommand(
    Refactoring.InlineVariable,
    inlineVariableCommand
  ),
  negateExpression: vscode.commands.registerCommand(
    Refactoring.NegateExpression,
    negateExpressionCommand
  ),
  removeRedundantElse: vscode.commands.registerCommand(
    Refactoring.RemoveRedundantElse,
    removeRedundantElseCommand
  ),
  flipIfElse: vscode.commands.registerCommand(
    Refactoring.FlipIfElse,
    flipIfElseCommand
  )
};

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

async function removeRedundantElseCommand() {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    return;
  }

  const { document, selection } = activeTextEditor;

  await executeSafely(() =>
    removeRedundantElse(
      document.getText(),
      createSelectionFromVSCode(selection),
      createWriteInVSCode(document),
      showErrorMessageInVSCode
    )
  );
}

async function flipIfElseCommand() {
  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    return;
  }

  const { document, selection } = activeTextEditor;

  await executeSafely(() =>
    flipIfElse(
      document.getText(),
      createSelectionFromVSCode(selection),
      createWriteInVSCode(document),
      showErrorMessageInVSCode
    )
  );
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
