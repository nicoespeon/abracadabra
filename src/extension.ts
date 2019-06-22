import * as vscode from "vscode";

import commands from "./commands";
import { createActionProvidersFor } from "./action-providers";

const SUPPORTED_LANGUAGES = [
  "javascript",
  "javascriptreact",
  "typescript",
  "typescriptreact"
];

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    commands.renameSymbol,
    commands.extractVariable,
    commands.inlineVariable,
    commands.negateExpression,
    commands.flipIfElse
  );

  SUPPORTED_LANGUAGES.forEach(language => {
    const actionProviders = createActionProvidersFor(language);
    context.subscriptions.push(
      actionProviders.negateExpression,
      actionProviders.removeRedundantElse,
      actionProviders.flipIfElse
    );
  });
}

export function deactivate() {}
