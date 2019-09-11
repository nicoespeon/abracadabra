import * as vscode from "vscode";

import addBracesToArrowFunctionCommand from "./refactorings/add-braces-to-arrow-function/command";
import bubbleUpIfStatementCommand from "./refactorings/bubble-up-if-statement/command";
import convertIfElseToTernaryCommand from "./refactorings/convert-if-else-to-ternary/command";
import convertIfElseToSwitchCommand from "./refactorings/convert-if-else-to-switch/command";
import convertTernaryToIfElseCommand from "./refactorings/convert-ternary-to-if-else/command";
import convertToTemplateLiteralCommand from "./refactorings/convert-to-template-literal/command";
import extractVariableCommand from "./refactorings/extract-variable/command";
import flipIfElseCommand from "./refactorings/flip-if-else/command";
import flipTernaryCommand from "./refactorings/flip-ternary/command";
import inlineVariableOrFunctionCommand from "./refactorings/inline-variable-or-function/command";
import mergeIfStatementsCommand from "./refactorings/merge-if-statements/command";
import mergeWithPreviousIfStatementCommand from "./refactorings/merge-with-previous-if-statement/command";
import moveStatementDownCommand from "./refactorings/move-statement-down/command";
import moveStatementUpCommand from "./refactorings/move-statement-up/command";
import negateExpressionCommand from "./refactorings/negate-expression/command";
import removeBracesFromArrowFunctionCommand from "./refactorings/remove-braces-from-arrow-function/command";
import removeRedundantElseCommand from "./refactorings/remove-redundant-else/command";
import renameSymbolCommand from "./refactorings/rename-symbol/command";
import replaceBinaryWithAssignmentCommand from "./refactorings/replace-binary-with-assignment/command";
import splitDeclarationAndInitializationCommand from "./refactorings/split-declaration-and-initialization/command";
import splitIfStatementCommand from "./refactorings/split-if-statement/command";

import addBracesToArrowFunctionActionProviderFor from "./refactorings/add-braces-to-arrow-function/action-provider";
import bubbleUpIfStatementActionProviderFor from "./refactorings/bubble-up-if-statement/action-provider";
import convertIfElseToTernaryActionProviderFor from "./refactorings/convert-if-else-to-ternary/action-provider";
import convertIfElseToSwitchActionProviderFor from "./refactorings/convert-if-else-to-switch/action-provider";
import convertTernaryToIfElseActionProviderFor from "./refactorings/convert-ternary-to-if-else/action-provider";
import convertToTemplateLiteralActionProviderFor from "./refactorings/convert-to-template-literal/action-provider";
import flipIfElseActionProviderFor from "./refactorings/flip-if-else/action-provider";
import flipTernaryActionProviderFor from "./refactorings/flip-ternary/action-provider";
import mergeIfStatementsActionProviderFor from "./refactorings/merge-if-statements/action-provider";
import mergeWithPreviousIfStatementActionProviderFor from "./refactorings/merge-with-previous-if-statement/action-provider";
import negateExpressionActionProviderFor from "./refactorings/negate-expression/action-provider";
import removeBracesFromArrowFunctionActionProviderFor from "./refactorings/remove-braces-from-arrow-function/action-provider";
import removeRedundantElseActionProviderFor from "./refactorings/remove-redundant-else/action-provider";
import replaceBinaryWithAssignmentActionProviderFor from "./refactorings/replace-binary-with-assignment/action-provider";
import splitDeclarationAndInitializationActionProviderFor from "./refactorings/split-declaration-and-initialization/action-provider";
import splitIfStatementActionProviderFor from "./refactorings/split-if-statement/action-provider";

const SUPPORTED_LANGUAGES = [
  "javascript",
  "javascriptreact",
  "typescript",
  "typescriptreact"
];

export function activate(context: vscode.ExtensionContext) {
  [
    addBracesToArrowFunctionCommand,
    bubbleUpIfStatementCommand,
    convertIfElseToTernaryCommand,
    convertIfElseToSwitchCommand,
    convertTernaryToIfElseCommand,
    convertToTemplateLiteralCommand,
    extractVariableCommand,
    flipIfElseCommand,
    flipTernaryCommand,
    inlineVariableOrFunctionCommand,
    mergeIfStatementsCommand,
    mergeWithPreviousIfStatementCommand,
    moveStatementDownCommand,
    moveStatementUpCommand,
    negateExpressionCommand,
    removeBracesFromArrowFunctionCommand,
    removeRedundantElseCommand,
    renameSymbolCommand,
    replaceBinaryWithAssignmentCommand,
    splitDeclarationAndInitializationCommand,
    splitIfStatementCommand
  ].forEach(command => context.subscriptions.push(command));

  SUPPORTED_LANGUAGES.forEach(language => {
    [
      addBracesToArrowFunctionActionProviderFor(language),
      bubbleUpIfStatementActionProviderFor(language),
      convertIfElseToTernaryActionProviderFor(language),
      convertIfElseToSwitchActionProviderFor(language),
      convertTernaryToIfElseActionProviderFor(language),
      convertToTemplateLiteralActionProviderFor(language),
      flipIfElseActionProviderFor(language),
      flipTernaryActionProviderFor(language),
      mergeIfStatementsActionProviderFor(language),
      mergeWithPreviousIfStatementActionProviderFor(language),
      negateExpressionActionProviderFor(language),
      removeBracesFromArrowFunctionActionProviderFor(language),
      removeRedundantElseActionProviderFor(language),
      replaceBinaryWithAssignmentActionProviderFor(language),
      splitDeclarationAndInitializationActionProviderFor(language),
      splitIfStatementActionProviderFor(language)
    ].forEach(actionProvider => context.subscriptions.push(actionProvider));
  });
}

export function deactivate() {}
