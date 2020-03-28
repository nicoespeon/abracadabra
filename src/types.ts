import { Code, Editor } from "./editor/editor";
import { Selection } from "./editor/selection";
import { AST, Visitor, NodePath } from "./ast";

export {
  Refactoring,
  RefactoringWithActionProvider,
  Operation,
  ActionProvider,
  LegacyActionProvider,
  isRefactoringWithActionProvider,
  isRefactoringWithLegacyActionProvider
};

interface Refactoring {
  command: {
    key: string;
    operation: Operation;
  };
}

interface ActionProvider {
  message: string;
  isPreferred?: boolean;
  createVisitor: (
    selection: Selection,
    onMatch: (path: NodePath) => void,
    refactoring: RefactoringWithActionProvider
  ) => Visitor;
  updateMessage?: (path: NodePath) => string;
}

interface LegacyActionProvider {
  message: string;
  isPreferred?: boolean;
  canPerform: (ast: AST, selection: Selection) => boolean;
}

interface RefactoringWithActionProvider<
  ActionProviderType = ActionProvider | LegacyActionProvider
> extends Refactoring {
  command: {
    key: string;
    title: string;
    operation: Operation;
  };
  actionProvider: ActionProviderType;
}

type Operation = (
  code: Code,
  selection: Selection,
  write: Editor
) => Promise<void>;

function isLegacyActionProvider(
  actionProvider: ActionProvider | LegacyActionProvider
): actionProvider is LegacyActionProvider {
  return (actionProvider as LegacyActionProvider).canPerform !== undefined;
}

function isRefactoringWithLegacyActionProvider(
  refactoring: RefactoringWithActionProvider
): refactoring is RefactoringWithActionProvider<LegacyActionProvider> {
  return isLegacyActionProvider(refactoring.actionProvider);
}

function isRefactoringWithActionProvider(
  refactoring: RefactoringWithActionProvider
): refactoring is RefactoringWithActionProvider<ActionProvider> {
  return !isLegacyActionProvider(refactoring.actionProvider);
}
