import * as vscode from "vscode";

import commands from "./commands";

// If all refactorings follow same pattern, we could dynamically import them.
import convertIfElseToTernaryCommand from "./refactorings/convert-if-else-to-ternary/command";
import convertTernaryToIfElseCommand from "./refactorings/convert-ternary-to-if-else/command";
import extractVariableCommand from "./refactorings/extract-variable/command";
import flipIfElseCommand from "./refactorings/flip-if-else/command";
import flipTernaryCommand from "./refactorings/flip-ternary/command";
import inlineVariableCommand from "./refactorings/inline-variable/command";
import moveStatementDownCommand from "./refactorings/move-statement-down/command";
import moveStatementUpCommand from "./refactorings/move-statement-up/command";
import negateExpressionCommand from "./refactorings/negate-expression/command";
import removeRedundantElseCommand from "./refactorings/remove-redundant-else/command";

import convertIfElseToTernaryActionProviderFor from "./refactorings/convert-if-else-to-ternary/action-provider";
import convertTernaryToIfElseActionProviderFor from "./refactorings/convert-ternary-to-if-else/action-provider";
import flipIfElseActionProviderFor from "./refactorings/flip-if-else/action-provider";
import flipTernaryActionProviderFor from "./refactorings/flip-ternary/action-provider";
import negateExpressionActionProviderFor from "./refactorings/negate-expression/action-provider";
import removeRedundantElseActionProviderFor from "./refactorings/remove-redundant-else/action-provider";

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
    moveStatementDownCommand,
    moveStatementUpCommand,
    negateExpressionCommand,
    removeRedundantElseCommand
  ].forEach(command => context.subscriptions.push(command));

  SUPPORTED_LANGUAGES.forEach(language => {
    [
      convertIfElseToTernaryActionProviderFor(language),
      convertTernaryToIfElseActionProviderFor(language),
      flipIfElseActionProviderFor(language),
      flipTernaryActionProviderFor(language),
      negateExpressionActionProviderFor(language),
      removeRedundantElseActionProviderFor(language)
    ].forEach(actionProvider => context.subscriptions.push(actionProvider));
  });
}

export function deactivate() {}
