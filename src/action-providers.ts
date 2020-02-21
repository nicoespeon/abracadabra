import * as vscode from "vscode";

import { createSelectionFromVSCode } from "./editor/adapters/vscode-editor";
import { RefactoringWithActionProvider, isLegacyActionProvider } from "./types";
import * as t from "./ast";
import { Selection } from "./editor/selection";

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

    const applicableRefactorings: RefactoringWithActionProvider[] = [];

    const onCanPeform = (
      path: t.NodePath<any>,
      refactoring: RefactoringWithActionProvider
    ) => {
      if (isLegacyActionProvider(refactoring.actionProvider)) {
        return;
      }

      if (refactoring.actionProvider.updateMessage) {
        refactoring.actionProvider.updateMessage(path);
      }

      applicableRefactorings.push(refactoring);
    };

    t.traverseAST(ast, {
      enter: (path: t.NodePath<any>) => {
        this.refactorings.forEach(refactoring =>
          this.canPerform(refactoring, path, selection, onCanPeform)
        );
      }
    });

    const applicableLegacyRefactorings = this.refactorings.filter(refactoring =>
      this.canPerformLegacy(refactoring, ast, selection)
    );

    return [...applicableRefactorings, ...applicableLegacyRefactorings].map(
      refactoring => this.buildCodeActionFor(refactoring)
    );
  }

  private canPerform(
    refactoring: RefactoringWithActionProvider,
    path: t.NodePath<any>,
    selection: Selection,
    onCanPerform: (
      matchedPath: t.NodePath<any>,
      refactoring: RefactoringWithActionProvider
    ) => void
  ) {
    if (isLegacyActionProvider(refactoring.actionProvider)) {
      return;
    }

    const visitor: t.Visitor = refactoring.actionProvider.createVisitor(
      selection,
      path => onCanPerform(path, refactoring),
      refactoring
    );

    this.visit(visitor, path);
  }

  private visit(visitor: any, path: t.NodePath<any>) {
    const node: t.Node = path.node;

    try {
      if (typeof visitor[node.type] === "function") {
        visitor[node.type](path);
      } else if (typeof visitor[node.type] === "object") {
        visitor[node.type].enter(path);
      }
    } catch (_) {
      // Silently fail, we don't care why it failed (e.g. code can't be parsed).
    }
  }

  private canPerformLegacy(
    refactoring: RefactoringWithActionProvider,
    ast: t.AST,
    selection: Selection
  ) {
    try {
      return (
        isLegacyActionProvider(refactoring.actionProvider) &&
        typeof refactoring.actionProvider.canPerform === "function" &&
        refactoring.actionProvider.canPerform(ast, selection)
      );
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
