import * as vscode from "vscode";

import { createSelectionFromVSCode } from "./editor/adapters/vscode-editor";
import {
  RefactoringWithActionProvider,
  ActionProvider,
  LegacyActionProvider,
  isRefactoringWithActionProvider,
  isRefactoringWithLegacyActionProvider
} from "./types";
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

    return [
      ...this.findApplicableRefactorings(ast, selection),
      ...this.findApplicableLegacyRefactorings(ast, selection)
    ].map(refactoring => this.buildCodeActionFor(refactoring));
  }

  private findApplicableLegacyRefactorings(ast: t.File, selection: Selection) {
    const legacyRefactorings = this.refactorings.filter(
      isRefactoringWithLegacyActionProvider
    );
    const applicableLegacyRefactorings = legacyRefactorings.filter(
      refactoring => this.canPerformLegacy(refactoring, ast, selection)
    );
    return applicableLegacyRefactorings;
  }

  private findApplicableRefactorings(
    ast: t.File,
    selection: Selection
  ): RefactoringWithActionProvider<ActionProvider>[] {
    const refactorings = this.refactorings.filter(
      isRefactoringWithActionProvider
    );

    const applicableRefactorings: RefactoringWithActionProvider<
      ActionProvider
    >[] = [];

    t.traverseAST(ast, {
      enter: (path: t.NodePath<any>) => {
        refactorings.forEach(refactoring =>
          this.visitAndCheckApplicability(
            refactoring,
            path,
            selection,
            (
              path: t.NodePath,
              refactoring: RefactoringWithActionProvider<ActionProvider>
            ) => {
              if (refactoring.actionProvider.updateMessage) {
                refactoring.actionProvider.message = refactoring.actionProvider.updateMessage(
                  path
                );
              }

              applicableRefactorings.push(refactoring);
            }
          )
        );
      }
    });

    return applicableRefactorings;
  }

  private visitAndCheckApplicability(
    refactoring: RefactoringWithActionProvider<ActionProvider>,
    path: t.NodePath<any>,
    selection: Selection,
    whenApplicable: (
      matchedPath: t.NodePath<any>,
      refactoring: RefactoringWithActionProvider<ActionProvider>
    ) => void
  ) {
    const visitor: t.Visitor = refactoring.actionProvider.createVisitor(
      selection,
      path => whenApplicable(path, refactoring),
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
    refactoring: RefactoringWithActionProvider<LegacyActionProvider>,
    ast: t.AST,
    selection: Selection
  ) {
    try {
      return (
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
