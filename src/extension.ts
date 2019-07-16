import * as vscode from "vscode";

import commands from "./commands";
import { createActionProvidersFor } from "./action-providers";

// If all refactorings follow same pattern, we could dynamically import them.
import convertIfElseToTernaryCommand from "./refactorings/convert-if-else-to-ternary/command";
import convertIfElseToTernaryActionProviderFor from "./refactorings/convert-if-else-to-ternary/action-provider";
import convertTernaryToIfElseCommand from "./refactorings/convert-ternary-to-if-else/command";
import convertTernaryToIfElseActionProviderFor from "./refactorings/convert-ternary-to-if-else/action-provider";

const SUPPORTED_LANGUAGES = [
  "javascript",
  "javascriptreact",
  "typescript",
  "typescriptreact"
];

export function activate(context: vscode.ExtensionContext) {
  [
    ...commands,
    convertIfElseToTernaryCommand,
    convertTernaryToIfElseCommand
  ].forEach(command => context.subscriptions.push(command));

  SUPPORTED_LANGUAGES.forEach(language => {
    [
      ...createActionProvidersFor(language),
      convertIfElseToTernaryActionProviderFor(language),
      convertTernaryToIfElseActionProviderFor(language)
    ].forEach(actionProvider => context.subscriptions.push(actionProvider));
  });
}

export function deactivate() {}
