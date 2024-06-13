import { Code, Editor } from "./editor/editor";
import { Selection } from "./editor/selection";
import { Visitor, NodePath } from "./ast";
export interface Refactoring {
  command: {
    key: string;
    operation: Operation;
  };
}

export interface RefactoringWithActionProvider {
  command: {
    key: string;
    title: string;
    operation: Operation;
  };
  actionProvider: {
    message: string;
    isPreferred?: boolean;
    createVisitor: (
      selection: Selection,
      onMatch: (path: NodePath) => void
    ) => Visitor;
    updateMessage?: (path: NodePath) => string;
  };
}

export type Operation = (editor: Editor) => Promise<void>;

export interface RefactoringWithActionProvider__NEW {
  command: {
    key: string;
    title: string;
    operation: Operation__NEW;
  };
  actionProvider: {
    message: string;
    isPreferred?: boolean;
    createVisitor: (
      selection: Selection,
      onMatch: (path: NodePath) => void
    ) => Visitor;
    updateMessage?: (path: NodePath) => string;
  };
}

export type Operation__NEW = (
  code: Code,
  selection: Selection
) => OperationResult;

export type OperationResult =
  | { action: "show error"; reason: string }
  | { action: "write"; code: Code };
