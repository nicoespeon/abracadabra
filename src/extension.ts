import * as vscode from "vscode";

import { xxxnew_RefactoringActionProvider } from "./action-providers";

import addBracesToArrowFunction from "./refactorings/add-braces-to-arrow-function";
import bubbleUpIfStatement from "./refactorings/bubble-up-if-statement";
import convertForToForeach from "./refactorings/convert-for-to-foreach";
import convertIfElseToSwitch from "./refactorings/convert-if-else-to-switch";
import convertIfElseToTernary from "./refactorings/convert-if-else-to-ternary";
import convertTernaryToIfElse from "./refactorings/convert-ternary-to-if-else";
import convertToTemplateLiteral from "./refactorings/convert-to-template-literal";
import flipIfElse from "./refactorings/flip-if-else";
import flipTernary from "./refactorings/flip-ternary";
import mergeWithPreviousIfStatement from "./refactorings/merge-with-previous-if-statement";
import removeBracesFromArrowFunction from "./refactorings/remove-braces-from-arrow-function";
import splitIfStatement from "./refactorings/split-if-statement";

import addBracesToArrowFunctionCommand from "./refactorings/add-braces-to-arrow-function/command";
import bubbleUpIfStatementCommand from "./refactorings/bubble-up-if-statement/command";
import convertForToForeachCommand from "./refactorings/convert-for-to-foreach/command";
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
import removeDeadCodeCommand from "./refactorings/remove-dead-code/command";
import removeRedundantElseCommand from "./refactorings/remove-redundant-else/command";
import renameSymbolCommand from "./refactorings/rename-symbol/command";
import replaceBinaryWithAssignmentCommand from "./refactorings/replace-binary-with-assignment/command";
import splitDeclarationAndInitializationCommand from "./refactorings/split-declaration-and-initialization/command";

import mergeIfStatementsActionProviderFor from "./refactorings/merge-if-statements/action-provider";
import negateExpressionActionProviderFor from "./refactorings/negate-expression/action-provider";
import removeDeadCodeActionProviderFor from "./refactorings/remove-dead-code/action-provider";
import removeRedundantElseActionProviderFor from "./refactorings/remove-redundant-else/action-provider";
import replaceBinaryWithAssignmentActionProviderFor from "./refactorings/replace-binary-with-assignment/action-provider";
import splitDeclarationAndInitializationActionProviderFor from "./refactorings/split-declaration-and-initialization/action-provider";

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
    convertForToForeachCommand,
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
    removeDeadCodeCommand,
    removeRedundantElseCommand,
    renameSymbolCommand,
    replaceBinaryWithAssignmentCommand,
    splitDeclarationAndInitializationCommand,
    addBracesToArrowFunctionCommand
  ].forEach(command => context.subscriptions.push(command));

  SUPPORTED_LANGUAGES.forEach(language => {
    [
      mergeIfStatementsActionProviderFor(language),
      negateExpressionActionProviderFor(language),
      removeDeadCodeActionProviderFor(language),
      removeRedundantElseActionProviderFor(language),
      replaceBinaryWithAssignmentActionProviderFor(language),
      splitDeclarationAndInitializationActionProviderFor(language)
    ].forEach(actionProvider => context.subscriptions.push(actionProvider));

    vscode.languages.registerCodeActionsProvider(
      language,
      new xxxnew_RefactoringActionProvider([
        addBracesToArrowFunction,
        bubbleUpIfStatement,
        convertForToForeach,
        convertIfElseToSwitch,
        convertIfElseToTernary,
        convertTernaryToIfElse,
        convertToTemplateLiteral,
        flipIfElse,
        flipTernary,
        mergeWithPreviousIfStatement,
        removeBracesFromArrowFunction,
        splitIfStatement
      ]),
      {
        providedCodeActionKinds: [vscode.CodeActionKind.RefactorRewrite]
      }
    );
  });
}

export function deactivate() {}
