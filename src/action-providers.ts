import * as vscode from "vscode";

import { createSelectionFromVSCode } from "./editor/adapters/vscode-editor";
import { RefactoringWithActionProvider } from "./types";
import * as t from "./ast";
import { Selection } from "./editor/selection";

export { RefactoringActionProvider };

type Refactoring = RefactoringWithActionProvider;

class RefactoringActionProvider implements vscode.CodeActionProvider {
  private refactorings: Refactoring[];

  constructor(refactorings: Refactoring[]) {
    this.refactorings = refactorings;
  }

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const NO_ACTION: vscode.CodeAction[] = [];

    if (this.isNavigatingAnIgnoredFile(document.uri.path)) {
      return NO_ACTION;
    }

    try {
      const ast = t.parse(document.getText());
      const selection = createSelectionFromVSCode(range);

      return this.findApplicableRefactorings(
        ast,
        selection
      ).map((refactoring) => this.buildCodeActionFor(refactoring));
    } catch {
      // Silently fail, we don't care why it failed (e.g. code can't be parsed).
      return NO_ACTION;
    }
  }

  private isNavigatingAnIgnoredFile(filePath: string): boolean {
    return this.getIgnoredFolders().some((ignored) =>
      filePath.includes(`/${ignored}/`)
    );
  }

  private getIgnoredFolders(): string[] {
    const ignoredFolders = vscode.workspace
      .getConfiguration("abracadabra")
      .get("ignoredFolders");

    if (!Array.isArray(ignoredFolders)) {
      console.log(
        `abracadabra.ignoredFolders should be an array but current value is ${ignoredFolders}`
      );
      return [];
    }

    return ignoredFolders;
  }

  private findApplicableRefactorings(
    ast: t.File,
    selection: Selection
  ): Refactoring[] {
    const applicableRefactorings = new Map<string, Refactoring>();

    t.traverseAST(ast, {
      enter: (path) => {
        /**
         * Hint for perf improvement
         * =========================
         *
         * It seems we're trying each refactoring on each Node of the AST.
         * We could filter nodes for which selection isn't inside!
         */
        this.refactorings.forEach((refactoring) => {
          const {
            actionProvider,
            command: { key }
          } = refactoring;

          const visitor = actionProvider.createVisitor(
            selection,
            (visitedPath) => {
              if (actionProvider.updateMessage) {
                actionProvider.message = actionProvider.updateMessage(
                  visitedPath
                );
              }

              applicableRefactorings.set(key, refactoring);
            }
          );

          this.visit(visitor, path);
        });
      }
    });

    return Array.from(applicableRefactorings.values());
  }

  private visit(visitor: t.Visitor, path: t.NodePath) {
    if (typeof visitor.enter === "function") {
      visitor.enter(path, path.state);
    }

    const visitorNode = visitor[path.node.type];
    if (typeof visitorNode === "function") {
      // @ts-ignore visitor can expect `NodePath<File>` but `path` is typed as `NodePath<Node>`. It should be OK at runtime.
      visitorNode.bind(visitor)(path, path.state);
    }
  }

  private buildCodeActionFor(refactoring: Refactoring) {
    const action = new vscode.CodeAction(
      `${refactoring.actionProvider.message} ✨`,
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
