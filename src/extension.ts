import * as vscode from "vscode";

import { createCommand } from "./commands";
import { RefactoringActionProvider } from "./action-providers";
import { Refactoring, RefactoringWithActionProvider } from "./types";

import addBracesToArrowFunction from "./refactorings/add-braces-to-arrow-function";
import addBracesToIfStatement from "./refactorings/add-braces-to-if-statement";
import convertForToForeach from "./refactorings/convert-for-to-foreach";
import convertIfElseToSwitch from "./refactorings/convert-if-else-to-switch";
import convertSwitchToIfElse from "./refactorings/convert-switch-to-if-else";
import convertIfElseToTernary from "./refactorings/convert-if-else-to-ternary";
import convertTernaryToIfElse from "./refactorings/convert-ternary-to-if-else";
import convertToArrowFunction from "./refactorings/convert-to-arrow-function";
import convertToTemplateLiteral from "./refactorings/convert-to-template-literal";
import convertLetToConst from "./refactorings/convert-let-to-const";
import extract from "./refactorings/extract";
import extractGenericType from "./refactorings/extract-generic-type";
import extractInterface from "./refactorings/extract-interface";
import flipIfElse from "./refactorings/flip-if-else";
import flipTernary from "./refactorings/flip-ternary";
import inline from "./refactorings/inline";
import liftUpConditional from "./refactorings/lift-up-conditional";
import mergeIfStatements from "./refactorings/merge-if-statements";
import mergeWithPreviousIfStatement from "./refactorings/merge-with-previous-if-statement";
import moveStatementDown from "./refactorings/move-statement-down";
import moveStatementUp from "./refactorings/move-statement-up";
import moveToExistingFile from "./refactorings/move-to-existing-file";
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
import simplifyTernary from "./refactorings/simplify-ternary";
import splitDeclarationAndInitialization from "./refactorings/split-declaration-and-initialization";
import splitIfStatement from "./refactorings/split-if-statement";
import splitMultipleDeclarations from "./refactorings/split-multiple-declarations";
// REFACTOR: this refactoring wasn't implemented following the usual pattern. See https://github.com/nicoespeon/abracadabra/issues/180
import { ExtractClassActionProvider } from "./refactorings/extract-class/extract-class-action-provider";
import { ExtractClassCommand } from "./refactorings/extract-class/extract-class-command";
import { ABRACADABRA_EXTRACT_CLASS_COMMAND } from "./refactorings/extract-class/EXTRACT_CLASS_COMMAND";

const refactorings: { [key: string]: ConfiguredRefactoring } = {
  typescriptOnly: {
    languages: ["typescript", "typescriptreact"],
    withoutActionProvider: [],
    withActionProvider: [extractGenericType, extractInterface]
  },
  reactOnly: {
    languages: ["javascriptreact", "typescriptreact"],
    withoutActionProvider: [reactConvertToPureComponent],
    withActionProvider: [
      reactAddBracesToJsxAttribute,
      reactRemoveBracesFromJsxAttribute
    ]
  },
  allButVue: {
    languages: [
      "javascript",
      "javascriptreact",
      "typescript",
      "typescriptreact"
    ],
    withoutActionProvider: [],
    withActionProvider: [moveToExistingFile]
  },
  allLanguages: {
    languages: [
      "javascript",
      "javascriptreact",
      "typescript",
      "typescriptreact",
      "vue"
    ],
    withoutActionProvider: [
      extract,
      inline,
      moveStatementDown,
      moveStatementUp,
      renameSymbol
    ],
    withActionProvider: [
      addBracesToArrowFunction,
      addBracesToIfStatement,
      convertForToForeach,
      convertIfElseToSwitch,
      convertIfElseToTernary,
      convertLetToConst,
      convertSwitchToIfElse,
      convertTernaryToIfElse,
      convertToArrowFunction,
      convertToTemplateLiteral,
      flipIfElse,
      flipTernary,
      liftUpConditional,
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
      splitIfStatement,
      splitMultipleDeclarations
    ]
  }
};

type ConfiguredRefactoring = {
  languages: string[];
  withoutActionProvider: Refactoring[];
  withActionProvider: RefactoringWithActionProvider[];
};

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("abracadabra.quickFix", () => {
      vscode.commands.executeCommand("editor.action.quickFix");
    })
  );

  Object.values(refactorings).forEach(
    ({ withoutActionProvider, withActionProvider }) => {
      withoutActionProvider
        .concat(withActionProvider)
        .forEach(({ command }) =>
          context.subscriptions.push(
            vscode.commands.registerCommand(
              `abracadabra.${command.key}`,
              createCommand(command.operation)
            )
          )
        );
    }
  );

  const withActionProviderPerLanguage = Object.values(refactorings).reduce(
    (memo, { languages, withActionProvider }) => {
      languages.forEach((language) => {
        if (!memo[language]) memo[language] = [];
        memo[language].push(...withActionProvider);
      });

      return memo;
    },
    {} as {
      [language: string]: RefactoringWithActionProvider[];
    }
  );

  Object.entries(withActionProviderPerLanguage).forEach(
    ([language, refactorings]) => {
      vscode.languages.registerCodeActionsProvider(
        language,
        new RefactoringActionProvider(refactorings),
        { providedCodeActionKinds: [vscode.CodeActionKind.RefactorRewrite] }
      );
    }
  );

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      ABRACADABRA_EXTRACT_CLASS_COMMAND,
      ExtractClassCommand.execute
    )
  );

  refactorings.allLanguages.languages.forEach((language) => {
    vscode.languages.registerCodeActionsProvider(
      language,
      new ExtractClassActionProvider(),
      { providedCodeActionKinds: [vscode.CodeActionKind.RefactorExtract] }
    );
  });
}

export function deactivate() {}
