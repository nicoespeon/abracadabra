import * as vscode from "vscode";
import cloneDeep from "lodash.clonedeep";

import { createSelectionFromVSCode } from "./editor/adapters/vscode-editor";
import { Selection } from "./editor/selection";
import { RefactoringWithActionProvider } from "./types";
import * as t from "./ast";

export { RefactoringActionProvider };

class RefactoringActionProvider implements vscode.CodeActionProvider {
  private refactorings: RefactoringWithActionProvider[];

  constructor(refactorings: RefactoringWithActionProvider[]) {
    this.refactorings = refactorings;
  }

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const ast = t.parse(document.getText());
    const selection = createSelectionFromVSCode(range);

    return this.refactorings
      .filter(refactoring =>
        this.canPerform(refactoring, cloneDeep(ast), selection)
      )
      .map(refactoring => this.buildCodeActionFor(refactoring));
  }

  private canPerform(
    refactoring: RefactoringWithActionProvider,
    ast: t.AST,
    selection: Selection
  ) {
    try {
      return refactoring.actionProvider.canPerform(ast, selection);
    } catch (_) {
      // Silently fail, we don't care why it failed (e.g. code can't be parsed).
      return false;
    }
  }

  private buildCodeActionFor(refactoring: RefactoringWithActionProvider) {
    const action = new vscode.CodeAction(
      `✨ ${refactoring.actionProvider.message}`,
      vscode.CodeActionKind.RefactorRewrite
    );

    action.isPreferred = refactoring.actionProvider.isPreferred;
    action.command = {
      command: `abracadabra.${refactoring.command.key}`,
      title: refactoring.command.title
    };

    return action;
  }
}
