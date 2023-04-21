import * as vscode from "vscode";

import { RefactoringActionProvider } from "./action-providers";
import { createCommand } from "./commands";
import { VSCodeEditor } from "./editor/adapters/vscode-editor";
import refreshHighlights from "./highlights/refresh-highlights";
import removeAllHighlights from "./highlights/remove-all-highlights";
import toggleHighlight from "./highlights/toggle-highlight";
import addNumericSeparator from "./refactorings/add-numeric-separator";
import changeSignature from "./refactorings/change-signature";
import convertForEachToForOf from "./refactorings/convert-for-each-to-for-of";
import convertForToForEach from "./refactorings/convert-for-to-for-each";
import convertIfElseToSwitch from "./refactorings/convert-if-else-to-switch";
import convertIfElseToTernary from "./refactorings/convert-if-else-to-ternary";
import convertLetToConst from "./refactorings/convert-let-to-const";
import convertSwitchToIfElse from "./refactorings/convert-switch-to-if-else";
import convertTernaryToIfElse from "./refactorings/convert-ternary-to-if-else";
import convertToArrowFunction from "./refactorings/convert-to-arrow-function";
import convertToTemplateLiteral from "./refactorings/convert-to-template-literal";
import createFactoryForConstructor from "./refactorings/create-factory-for-constructor";
import destructureObject from "./refactorings/destructure-object";
import extract from "./refactorings/extract";
import extractGenericType from "./refactorings/extract-generic-type";
import extractInterface from "./refactorings/extract-interface";
import flipIfElse from "./refactorings/flip-if-else";
import flipOperator from "./refactorings/flip-operator";
import flipTernary from "./refactorings/flip-ternary";
import inline from "./refactorings/inline";
import invertBooleanLogic from "./refactorings/invert-boolean-logic";
import liftUpConditional from "./refactorings/lift-up-conditional";
import mergeIfStatements from "./refactorings/merge-if-statements";
import mergeWithPreviousIfStatement from "./refactorings/merge-with-previous-if-statement";
import moveStatementDown from "./refactorings/move-statement-down";
import moveStatementUp from "./refactorings/move-statement-up";
import moveToExistingFile from "./refactorings/move-to-existing-file";
import reactExtractUseCallback from "./refactorings/react/extract-use-callback";
import removeDeadCode from "./refactorings/remove-dead-code";
import removeJsxFragment from "./refactorings/remove-jsx-fragment";
import removeRedundantElse from "./refactorings/remove-redundant-else";
import renameSymbol from "./refactorings/rename-symbol";
import replaceBinaryWithAssignment from "./refactorings/replace-binary-with-assignment";
import simplifyTernary from "./refactorings/simplify-ternary";
import splitDeclarationAndInitialization from "./refactorings/split-declaration-and-initialization";
import splitIfStatement from "./refactorings/split-if-statement";
import splitMultipleDeclarations from "./refactorings/split-multiple-declarations";
import toggleBraces from "./refactorings/toggle-braces";
import wrapInJsxFrament from "./refactorings/wrap-in-jsx-fragment";
import { Refactoring, RefactoringWithActionProvider } from "./types";

const refactorings: { [key: string]: ConfiguredRefactoring } = {
  typescriptOnly: {
    languages: ["typescript", "typescriptreact"],
    withoutActionProvider: [],
    withActionProvider: [extractGenericType, extractInterface]
  },
  reactOnly: {
    languages: ["javascriptreact", "typescriptreact"],
    withoutActionProvider: [],
    withActionProvider: [
      reactExtractUseCallback,
      wrapInJsxFrament,
      removeJsxFragment
    ]
  },
  allButVueAndSvelte: {
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
      "vue",
      "svelte"
    ],
    withoutActionProvider: [
      extract,
      destructureObject,
      moveStatementDown,
      moveStatementUp,
      renameSymbol
    ],
    withActionProvider: [
      addNumericSeparator,
      changeSignature,
      convertForEachToForOf,
      convertForToForEach,
      convertIfElseToSwitch,
      convertIfElseToTernary,
      convertLetToConst,
      convertSwitchToIfElse,
      convertTernaryToIfElse,
      convertToArrowFunction,
      convertToTemplateLiteral,
      createFactoryForConstructor,
      flipIfElse,
      flipTernary,
      flipOperator,
      inline,
      liftUpConditional,
      mergeIfStatements,
      mergeWithPreviousIfStatement,
      invertBooleanLogic,
      removeDeadCode,
      removeRedundantElse,
      replaceBinaryWithAssignment,
      simplifyTernary,
      splitDeclarationAndInitialization,
      splitIfStatement,
      splitMultipleDeclarations,
      toggleBraces
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

  const commands = Object.values(refactorings).flatMap(
    ({ withoutActionProvider, withActionProvider }) =>
      withoutActionProvider.concat(withActionProvider)
  );

  commands
    .concat([toggleHighlight, refreshHighlights, removeAllHighlights])
    .forEach(({ command }) => {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          `abracadabra.${command.key}`,
          createCommand(command.operation)
        )
      );
    });

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

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (!editor) return;
    VSCodeEditor.restoreHighlightDecorations(editor);
  });

  vscode.workspace.onWillRenameFiles((event) => {
    VSCodeEditor.renameHighlightsFilePath(event);
  });

  vscode.workspace.onDidChangeTextDocument((event) => {
    VSCodeEditor.repositionHighlights(event);

    const activeTextEditor = vscode.window.activeTextEditor;
    if (activeTextEditor) {
      VSCodeEditor.restoreHighlightDecorations(activeTextEditor);
    }
  });
}

export function deactivate() {}
