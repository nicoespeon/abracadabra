import * as vscode from "vscode";

import commands from "./commands";
import { createActionProvidersFor } from "./action-providers";

// If all refactorings follow same pattern, we could dynamically import them.
import convertIfElseToTernaryCommand from "./refactorings/convert-if-else-to-ternary/command";
import convertTernaryToIfElseCommand from "./refactorings/convert-ternary-to-if-else/command";
import extractVariableCommand from "./refactorings/extract-variable/command";
import flipIfElseCommand from "./refactorings/flip-if-else/command";
import flipTernaryCommand from "./refactorings/flip-ternary/command";
import inlineVariableCommand from "./refactorings/inline-variable/command";
import moveStatementDownCommand from "./refactorings/move-statement-down/command";

// If all refactorings follow same pattern, we could dynamically import them.
import convertIfElseToTernaryActionProviderFor from "./refactorings/convert-if-else-to-ternary/action-provider";
import convertTernaryToIfElseActionProviderFor from "./refactorings/convert-ternary-to-if-else/action-provider";
import flipIfElseActionProviderFor from "./refactorings/flip-if-else/action-provider";
import flipTernaryActionProviderFor from "./refactorings/flip-ternary/action-provider";

const SUPPORTED_LANGUAGES = [
  "javascript",
  "javascriptreact",
  "typescript",
  "typescriptreact"
];

export function activate(context: vscode.ExtensionContext) {
  [
    ...commands,
    convertIfElseToTernaryCommand,
    convertTernaryToIfElseCommand,
    extractVariableCommand,
    flipIfElseCommand,
    flipTernaryCommand,
    inlineVariableCommand,
    moveStatementDownCommand
  ].forEach(command => context.subscriptions.push(command));

  SUPPORTED_LANGUAGES.forEach(language => {
    [
      ...createActionProvidersFor(language),
      convertIfElseToTernaryActionProviderFor(language),
      convertTernaryToIfElseActionProviderFor(language),
      flipIfElseActionProviderFor(language),
      flipTernaryActionProviderFor(language)
    ].forEach(actionProvider => context.subscriptions.push(actionProvider));
  });
}

export function deactivate() {}
