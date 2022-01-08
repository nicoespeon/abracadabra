import * as vscode from "vscode";
import minimatch from "minimatch";

import { RefactoringWithActionProvider } from "./types";
import * as t from "./ast";
import { Editor } from "./editor/editor";
import { createVSCodeEditor } from "./editor/adapters/create-vscode-editor";
import {
  getIgnoredFolders,
  getIgnoredPatterns,
  shouldShowInQuickFix
} from "./vscode-configuration";
import { TypeChecker, ConsoleLogger } from "./type-checker";

export { RefactoringActionProvider };

type Refactoring = RefactoringWithActionProvider;

class RefactoringActionProvider implements vscode.CodeActionProvider {
  constructor(private refactorings: Refactoring[]) {}

  provideCodeActions(
    document: vscode.TextDocument
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const NO_ACTION: vscode.CodeAction[] = [];

    if (this.isNavigatingAnIgnoredFile(document.uri.path)) {
      return NO_ACTION;
    }

    const editor = createVSCodeEditor();
    if (!editor) return NO_ACTION;

    try {
      return this.findApplicableRefactorings(editor).map((refactoring) =>
        this.buildCodeActionFor(refactoring)
      );
    } catch {
      // Silently fail, we don't care why it failed (e.g. code can't be parsed).
      return NO_ACTION;
    }
  }

  private isNavigatingAnIgnoredFile(filePath: string): boolean {
    const relativeFilePath = vscode.workspace.asRelativePath(filePath);
    const isFolderIgnored = getIgnoredFolders().some((ignored) =>
      relativeFilePath.includes(`/${ignored}/`)
    );
    const isPatternIgnored = getIgnoredPatterns().some((ignored) =>
      minimatch(relativeFilePath, ignored)
    );
    return isFolderIgnored || isPatternIgnored;
  }

  private findApplicableRefactorings({
    code,
    selection
  }: Editor): Refactoring[] {
    const applicableRefactorings = new Map<string, Refactoring>();

    const refactoringsToCheck = this.refactorings.filter(
      ({ command: { key } }) => shouldShowInQuickFix(key)
    );

    t.traverseAST(t.parse(code), {
      enter: (path) => {
        /**
         * Hint for perf improvement
         * =========================
         *
         * It seems we're trying each refactoring on each Node of the AST.
         * We could filter nodes for which selection isn't inside!
         */
        refactoringsToCheck.forEach((refactoring) => {
          const {
            actionProvider,
            command: { key }
          } = refactoring;

          const visitor = actionProvider.createVisitor(
            selection,
            (visitedPath) => {
              if (actionProvider.updateMessage) {
                actionProvider.message =
                  actionProvider.updateMessage(visitedPath);
              }

              applicableRefactorings.set(key, refactoring);
            },
            new TypeChecker(code, new ConsoleLogger())
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

    const visitorNode = this.getVisitorNode(visitor, path);
    // call enter shorthand of e.g. { Identifier() { ... } }
    if (typeof visitorNode === "function") {
      // @ts-expect-error visitor can expect `NodePath<File>` but `path` is typed as `NodePath<Node>`. It should be OK at runtime.
      visitorNode.bind(visitor)(path, path.state);
    } else if (typeof visitorNode === "object" && visitorNode !== null) {
      // call methods of e.g. { Identifier: { exit() { ... } } }
      for (const method of Object.values(visitorNode)) {
        if (typeof method === "function") {
          method.bind(visitor)(path, path.state);
        }
      }
    }
  }

  private getVisitorNode(visitor: t.Visitor, path: t.NodePath) {
    const nodeType = path.node.type;

    if (visitor[nodeType]) {
      return visitor[nodeType];
    }

    const visitorTypes = Object.keys(visitor) as (keyof t.Visitor)[];
    const matchingType = visitorTypes.find((type) => t.isType(nodeType, type));
    return matchingType ? visitor[matchingType] : null;
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
