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
  commands.forEach(command => context.subscriptions.push(command));

  SUPPORTED_LANGUAGES.forEach(language => {
    createActionProvidersFor(language).forEach(actionProvider =>
      context.subscriptions.push(actionProvider)
    );
  });
}

export function deactivate() {}
