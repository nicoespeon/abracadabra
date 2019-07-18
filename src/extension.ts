import * as vscode from "vscode";

import addBracesToArrowFunction from "./refactorings/add-braces-to-arrow-function/command";
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
import renameSymbolCommand from "./refactorings/rename-symbol/command";

import addBracesToArrowFunctionActionProviderFor from "./refactorings/add-braces-to-arrow-function/action-provider";
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
    addBracesToArrowFunction,
    convertIfElseToTernaryCommand,
    convertTernaryToIfElseCommand,
    extractVariableCommand,
    flipIfElseCommand,
    flipTernaryCommand,
    inlineVariableCommand,
    moveStatementDownCommand,
    moveStatementUpCommand,
    negateExpressionCommand,
    removeRedundantElseCommand,
    renameSymbolCommand
  ].forEach(command => context.subscriptions.push(command));

  SUPPORTED_LANGUAGES.forEach(language => {
    [
      convertIfElseToTernaryActionProviderFor(language),
      convertTernaryToIfElseActionProviderFor(language),
      flipIfElseActionProviderFor(language),
      flipTernaryActionProviderFor(language),
      negateExpressionActionProviderFor(language),
      removeRedundantElseActionProviderFor(language),
      addBracesToArrowFunctionActionProviderFor(language)
    ].forEach(actionProvider => context.subscriptions.push(actionProvider));
  });
}

export function deactivate() {}
