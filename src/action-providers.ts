import * as vscode from "vscode";

import { createSelectionFromVSCode } from "./editor/adapters/vscode-editor";
import { RefactoringWithActionProvider } from "./types";
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
    t.traverseAST(ast, {
      enter: (path: t.NodePath<any>) => {
        this.refactorings.forEach(
          this.checkCanPerform(
            path,
            selection,
            (
              matchedPath: t.NodePath<any>,
              refactoring: RefactoringWithActionProvider
            ) => {
              if (refactoring.actionProvider.canPerformRefactoringMutator) {
                applicableRefactorings.push(
                  refactoring.actionProvider.canPerformRefactoringMutator(
                    matchedPath,
                    refactoring
                  )
                );
              } else {
                applicableRefactorings.push(refactoring);
              }
            }
          )
        );
        path.type;
      }
    });

    return [
      ...applicableRefactorings.map(refactoring =>
        this.buildCodeActionFor(refactoring)
      ),
      ...this.refactorings
        .filter(refactoring => this.canPerform(refactoring, ast, selection))
        .map(refactoring => this.buildCodeActionFor(refactoring))
    ];
  }

  private checkCanPerform(
    path: any,
    selection: any,
    onCanPerform: (
      matchedPath: t.NodePath<any>,
      refactoring: RefactoringWithActionProvider
    ) => void
  ) {
    return (refactoring: RefactoringWithActionProvider) => {
      if (refactoring.actionProvider.canPerformVisitorFactory) {
        const visitor: any = refactoring.actionProvider.canPerformVisitorFactory(
          selection,
          path => onCanPerform(path, refactoring),
          refactoring
        );

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
    };
  }

  private canPerform(
    refactoring: RefactoringWithActionProvider,
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
