import * as vscode from "vscode";

import { createDeprecatedCommand } from "./commands";
import { RefactoringActionProvider } from "./action-providers";

import addBracesToArrowFunction from "./refactorings/add-braces-to-arrow-function";
import addBracesToIfStatement from "./refactorings/add-braces-to-if-statement";
import bubbleUpIfStatement from "./refactorings/bubble-up-if-statement";
import convertForToForeach from "./refactorings/convert-for-to-foreach";
import convertFunctionDeclarationToArrowFunction from "./refactorings/convert-function-declaration-to-arrow-function";
import convertIfElseToSwitch from "./refactorings/convert-if-else-to-switch";
import convertSwitchToIfElse from "./refactorings/convert-switch-to-if-else";
import convertIfElseToTernary from "./refactorings/convert-if-else-to-ternary";
import convertTernaryToIfElse from "./refactorings/convert-ternary-to-if-else";
import convertToTemplateLiteral from "./refactorings/convert-to-template-literal";
import convertLetToConst from "./refactorings/convert-let-to-const";
import extract from "./refactorings/extract";
import extractInterface from "./refactorings/extract-interface";
import flipIfElse from "./refactorings/flip-if-else";
import flipTernary from "./refactorings/flip-ternary";
import inline from "./refactorings/inline";
import mergeIfStatements from "./refactorings/merge-if-statements";
import mergeWithPreviousIfStatement from "./refactorings/merge-with-previous-if-statement";
import moveStatementDown from "./refactorings/move-statement-down";
import moveStatementUp from "./refactorings/move-statement-up";
import negateExpression from "./refactorings/negate-expression";
import reactConvertToPureComponent from "./refactorings/react/convert-to-pure-component";
import reactAddBracesToJsxAttribute from "./refactorings/react/add-braces-to-jsx-attribute";
import reactRemoveBracesFromJsxAttribute from "./refactorings/react/remove-braces-from-jsx-attribute";
import removeBracesFromArrowFunction from "./refactorings/remove-braces-from-arrow-function";
import removeBracesFromIfStatement from "./refactorings/remove-braces-from-if-statement";
import removeDeadCode from "./refactorings/remove-dead-code";
import removeRedundantElse from "./refactorings/remove-redundant-else";
import renameSymbol from "./refactorings/rename-symbol";
import replaceBinaryWithAssignment from "./refactorings/replace-binary-with-assignment";
import splitDeclarationAndInitialization from "./refactorings/split-declaration-and-initialization";
import splitIfStatement from "./refactorings/split-if-statement";
import simplifyTernary from "./refactorings/simplify-ternary";

const TS_LANGUAGES = ["typescript", "typescriptreact"];
const REACT_LANGUAGES = ["javascriptreact", "typescriptreact"];
const ALL_LANGUAGES = [
  "javascript",
  "javascriptreact",
  "typescript",
  "typescriptreact"
];

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("abracadabra.quickFix", () => {
      vscode.commands.executeCommand("editor.action.quickFix");
    })
  );

  [
    addBracesToArrowFunction,
    addBracesToIfStatement,
    bubbleUpIfStatement,
    convertForToForeach,
    convertFunctionDeclarationToArrowFunction,
    convertIfElseToSwitch,
    convertSwitchToIfElse,
    convertIfElseToTernary,
    convertTernaryToIfElse,
    convertToTemplateLiteral,
    convertLetToConst,
    extract,
    extractInterface,
    flipIfElse,
    flipTernary,
    inline,
    mergeIfStatements,
    mergeWithPreviousIfStatement,
    moveStatementDown,
    moveStatementUp,
    negateExpression,
    reactConvertToPureComponent,
    reactAddBracesToJsxAttribute,
    reactRemoveBracesFromJsxAttribute,
    removeBracesFromArrowFunction,
    removeBracesFromIfStatement,
    removeDeadCode,
    removeRedundantElse,
    renameSymbol,
    replaceBinaryWithAssignment,
    simplifyTernary,
    splitDeclarationAndInitialization,
    splitIfStatement
  ].forEach(({ command }) =>
    context.subscriptions.push(
      vscode.commands.registerCommand(
        `abracadabra.${command.key}`,
        createDeprecatedCommand(command.operation)
      )
    )
  );

  TS_LANGUAGES.forEach((language) => {
    vscode.languages.registerCodeActionsProvider(
      language,
      new RefactoringActionProvider([extractInterface]),
      {
        providedCodeActionKinds: [vscode.CodeActionKind.RefactorRewrite]
      }
    );
  });

  REACT_LANGUAGES.forEach((language) => {
    vscode.languages.registerCodeActionsProvider(
      language,
      new RefactoringActionProvider([
        reactAddBracesToJsxAttribute,
        reactRemoveBracesFromJsxAttribute
      ]),
      {
        providedCodeActionKinds: [vscode.CodeActionKind.RefactorRewrite]
      }
    );
  });

  ALL_LANGUAGES.forEach((language) => {
    vscode.languages.registerCodeActionsProvider(
      language,
      new RefactoringActionProvider([
        addBracesToArrowFunction,
        addBracesToIfStatement,
        bubbleUpIfStatement,
        convertForToForeach,
        convertFunctionDeclarationToArrowFunction,
        convertIfElseToSwitch,
        convertSwitchToIfElse,
        convertIfElseToTernary,
        convertTernaryToIfElse,
        convertToTemplateLiteral,
        convertLetToConst,
        flipIfElse,
        flipTernary,
        mergeIfStatements,
        mergeWithPreviousIfStatement,
        negateExpression,
        removeBracesFromArrowFunction,
        removeBracesFromIfStatement,
        removeDeadCode,
        removeRedundantElse,
        replaceBinaryWithAssignment,
        simplifyTernary,
        splitDeclarationAndInitialization,
        splitIfStatement
      ]),
      {
        providedCodeActionKinds: [vscode.CodeActionKind.RefactorRewrite]
      }
    );
  });
}

export function deactivate() {}
