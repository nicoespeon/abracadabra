import { Code, Editor } from "./editor/editor";
import { Selection } from "./editor/selection";
import { AST, Visitor, NodePath } from "./ast";

export { Refactoring, RefactoringWithActionProvider, Operation };

interface Refactoring {
  command: {
    key: string;
    operation: Operation;
  };
}

interface ActionProvider {
  message: string;
  isPreferred?: boolean;
  canPerformVisitorFactory?: (
    selection: Selection,
    onMatch: (path: NodePath<any>) => void,
    refactoring: RefactoringWithActionProvider
  ) => Visitor;
  canPerformRefactoringMutator?: (
    path: NodePath<any>,
    refactoring: RefactoringWithActionProvider
  ) => RefactoringWithActionProvider;
  canPerform?: (ast: AST, selection: Selection) => boolean;
}

interface RefactoringWithActionProvider extends Refactoring {
  command: {
    key: string;
    title: string;
    operation: Operation;
  };
  actionProvider: ActionProvider;
}

type Operation = (
  code: Code,
  selection: Selection,
  write: Editor
) => Promise<void>;
