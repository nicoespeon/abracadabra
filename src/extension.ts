import * as vscode from "vscode";

import commands from "./commands";
import { createActionProvidersFor } from "./action-providers";

// If all refactorings follow same pattern, we could dynamically import them.
import convertIfElseToTernaryCommand from "./refactorings/convert-if-else-to-ternary/command";
import convertIfElseToTernaryActionProviderFor from "./refactorings/convert-if-else-to-ternary/action-provider";

const SUPPORTED_LANGUAGES = [
  "javascript",
  "javascriptreact",
  "typescript",
  "typescriptreact"
];

export function activate(context: vscode.ExtensionContext) {
  [...commands, convertIfElseToTernaryCommand].forEach(command =>
    context.subscriptions.push(command)
  );

  SUPPORTED_LANGUAGES.forEach(language => {
    [
      ...createActionProvidersFor(language),
      convertIfElseToTernaryActionProviderFor(language)
    ].forEach(actionProvider => context.subscriptions.push(actionProvider));
  });
}

export function deactivate() {}
