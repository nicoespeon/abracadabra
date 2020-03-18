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
    return this.refactorings
      .filter(isRefactoringWithLegacyActionProvider)
      .filter(refactoring =>
        this.canPerformLegacy(refactoring, ast, selection)
      );
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
      enter: path => {
        refactorings.forEach(refactoring =>
          this.visitAndCheckApplicability(
            refactoring,
            path,
            selection,
            (path, refactoring) => {
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
    path: t.NodePath,
    selection: Selection,
    whenApplicable: (
      matchedPath: t.NodePath,
      refactoring: RefactoringWithActionProvider<ActionProvider>
    ) => void
  ) {
    const visitor = refactoring.actionProvider.createVisitor(
      selection,
      path => whenApplicable(path, refactoring),
      refactoring
    );

    this.visit(visitor, path);
  }

  private visit(visitor: t.Visitor, path: t.NodePath) {
    const node = path.node;

    try {
      const visitorNode = visitor[node.type];
      if (typeof visitorNode === "function") {
        // @ts-ignore visitor can expect `NodePath<File>` but `path` is typed as `NodePath<Node>`. It should be OK at runtime.
        visitorNode.bind(visitor)(path, path.state);
      } else if (
        typeof visitorNode === "object" &&
        typeof visitorNode.enter === "function"
      ) {
        // @ts-ignore visitor can expect `NodePath<File>` but `path` is typed as `NodePath<Node>`. It should be OK at runtime.
        visitorNode.enter(path, path.state);
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
