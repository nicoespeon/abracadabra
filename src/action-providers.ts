import { minimatch } from "minimatch";
import * as vscode from "vscode";
import * as t from "./ast";
import { createVSCodeEditor } from "./editor/adapters/create-vscode-editor";
import { VSCodeEditor } from "./editor/adapters/vscode-editor";
import { Editor } from "./editor/editor";
import {
  RefactoringWithActionProviderConfig,
  RefactoringWithActionProviderConfig__NEW
} from "./refactorings";
import {
  getIgnoredFolders,
  getIgnoredPatterns,
  getMaxFileLinesCount,
  getMaxFileSizeKb,
  shouldShowInQuickFix
} from "./vscode-configuration";

type Refactoring =
  | RefactoringWithActionProviderConfig
  | RefactoringWithActionProviderConfig__NEW;

export class RefactoringActionProvider implements vscode.CodeActionProvider {
  constructor(private refactorings: Refactoring[]) {}

  async provideCodeActions(document: vscode.TextDocument) {
    const NO_ACTION: vscode.CodeAction[] = [];

    if (this.isNavigatingAnIgnoredFile(document)) {
      return NO_ACTION;
    }

    const editor = createVSCodeEditor();
    if (!editor) return NO_ACTION;

    try {
      return this.findApplicableRefactorings(editor).map((refactoring) =>
        this.buildCodeActionFor(refactoring, editor)
      );
    } catch {
      // Silently fail, we don't care why it failed (e.g. code can't be parsed).
      return NO_ACTION;
    }
  }

  private isNavigatingAnIgnoredFile(document: vscode.TextDocument) {
    const relativeFilePath = vscode.workspace.asRelativePath(document.uri.path);
    const isFolderIgnored = getIgnoredFolders().some((ignored) =>
      `/${relativeFilePath}`.includes(`/${ignored}/`)
    );
    const isPatternIgnored = getIgnoredPatterns().some((ignored) =>
      minimatch(relativeFilePath, ignored)
    );
    const isTooLong = document.lineCount > getMaxFileLinesCount();
    const fileSize = document.getText().length / 1024;
    const isTooBig = fileSize > getMaxFileSizeKb();
    return isFolderIgnored || isPatternIgnored || isTooLong || isTooBig;
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

  private buildCodeActionFor(refactoring: Refactoring, editor: VSCodeEditor) {
    const action = new vscode.CodeAction(
      `${refactoring.actionProvider.message} ✨`,
      vscode.CodeActionKind.RefactorRewrite
    );

    action.isPreferred = refactoring.actionProvider.isPreferred;
    action.command = {
      command: `abracadabra.${refactoring.command.key}`,
      title: refactoring.command.title,
      // Provide current editor, so refactoring executes with same context
      arguments: [editor.withSelection(editor.selection)]
    };

    return action;
  }
}
