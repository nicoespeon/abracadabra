import * as vscode from "vscode";
import { RefactoringActionProvider } from "./action-providers";
import { createCommand, createCommand__NEW } from "./commands";
import {
  VSCodeEditor,
  createSelectionFromVSCode,
  getCodeChangeFromVSCode
} from "./editor/adapters/vscode-editor";
import refreshHighlights from "./highlights/refresh-highlights";
import removeAllHighlights from "./highlights/remove-all-highlights";
import toggleHighlight from "./highlights/toggle-highlight";
import {
  RefactoringConfig,
  RefactoringConfig__DEPRECATED,
  RefactoringWithActionProviderConfig,
  RefactoringWithActionProviderConfig__DEPRECATED
} from "./refactorings";
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
import { isInsertingVariableInStringLiteral } from "./refactorings/convert-to-template-literal/convert-to-template-literal";
import createFactoryForConstructor from "./refactorings/create-factory-for-constructor";
import extract from "./refactorings/extract";
import extractFunction from "./refactorings/extract-function";
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
import moveStatementDown from "./refactorings/move-statement/move-statement-down";
import moveStatementUp from "./refactorings/move-statement/move-statement-up";
import removeDeadCode from "./refactorings/remove-dead-code";
import removeJsxFragment from "./refactorings/remove-jsx-fragment";
import removeRedundantElse from "./refactorings/remove-redundant-else";
import renameSymbol from "./refactorings/rename-symbol";
import replaceBinaryWithAssignment from "./refactorings/replace-binary-with-assignment";
import simplifyBoolean from "./refactorings/simplify-boolean";
import simplifyTernary from "./refactorings/simplify-ternary";
import splitDeclarationAndInitialization from "./refactorings/split-declaration-and-initialization";
import splitIfStatement from "./refactorings/split-if-statement";
import splitMultipleDeclarations from "./refactorings/split-multiple-declarations";
import toggleBraces from "./refactorings/toggle-braces";
import wrapInJsxFrament from "./refactorings/wrap-in-jsx-fragment";

const refactorings: { [key: string]: ConfiguredRefactoring } = {
  typescriptOnly: {
    languages: ["typescript", "typescriptreact"],
    withoutActionProvider: [],
    withoutActionProvider__NEW: [],
    withActionProvider: [extractGenericType],
    withActionProvider__NEW: [extractInterface]
  },
  reactOnly: {
    languages: ["javascriptreact", "typescriptreact"],
    withoutActionProvider: [],
    withoutActionProvider__NEW: [],
    withActionProvider: [wrapInJsxFrament, removeJsxFragment],
    withActionProvider__NEW: []
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
    withoutActionProvider: [extract],
    withoutActionProvider__NEW: [
      extractFunction,
      renameSymbol,
      moveStatementUp,
      moveStatementDown
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
      simplifyBoolean,
      simplifyTernary,
      splitDeclarationAndInitialization,
      splitIfStatement,
      toggleBraces
    ],
    withActionProvider__NEW: [splitMultipleDeclarations]
  }
};

type ConfiguredRefactoring = {
  languages: string[];
  withoutActionProvider: RefactoringConfig__DEPRECATED[];
  withoutActionProvider__NEW: RefactoringConfig[];
  withActionProvider: RefactoringWithActionProviderConfig__DEPRECATED[];
  withActionProvider__NEW: RefactoringWithActionProviderConfig[];
};

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("abracadabra.quickFix", () => {
      vscode.commands.executeCommand("editor.action.quickFix");
    })
  );

  [toggleHighlight, refreshHighlights, removeAllHighlights].forEach(
    ({ command }) => {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          `abracadabra.${command.key}`,
          createCommand(command.operation, { refreshHighlights: false })
        )
      );
    }
  );

  const commands = Object.values(refactorings).flatMap(
    ({ withoutActionProvider, withActionProvider }) =>
      withoutActionProvider.concat(withActionProvider)
  );

  commands.forEach(({ command }) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        `abracadabra.${command.key}`,
        createCommand(command.operation, { refreshHighlights: true })
      )
    );
  });

  const commands__NEW = Object.values(refactorings).flatMap(
    ({ withoutActionProvider__NEW, withActionProvider__NEW }) =>
      withoutActionProvider__NEW.concat(withActionProvider__NEW)
  );

  commands__NEW.forEach(({ command }) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        `abracadabra.${command.key}`,
        createCommand__NEW(command.operation, { refreshHighlights: true })
      )
    );
  });

  const withActionProviderPerLanguage = Object.values(refactorings).reduce(
    (memo, { languages, withActionProvider, withActionProvider__NEW }) => {
      languages.forEach((language) => {
        if (!memo[language]) memo[language] = [];
        memo[language].push(...withActionProvider);
        memo[language].push(...withActionProvider__NEW);
      });

      return memo;
    },
    {} as {
      [language: string]: (
        | RefactoringWithActionProviderConfig__DEPRECATED
        | RefactoringWithActionProviderConfig
      )[];
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
    if (!activeTextEditor) return;

    VSCodeEditor.restoreHighlightDecorations(activeTextEditor);

    if (event.document !== activeTextEditor.document) return;

    const changes = event.contentChanges.map(getCodeChangeFromVSCode);
    const hasAddsOrUpdates = changes.some((change) => change.type !== "delete");
    if (!hasAddsOrUpdates) return;

    const code = activeTextEditor.document.getText();
    const selection = createSelectionFromVSCode(activeTextEditor.selection);

    const canAutoConvert =
      vscode.workspace
        .getConfiguration("abracadabra")
        .get("autoConvertToTemplateLiteral") === true;

    if (canAutoConvert && isInsertingVariableInStringLiteral(code, selection)) {
      vscode.commands.executeCommand(
        `abracadabra.${convertToTemplateLiteral.command.key}`
      );
    }
  });
}

export function deactivate() {}
