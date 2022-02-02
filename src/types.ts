import { Editor } from "./editor/editor";
import { Selection } from "./editor/selection";
import { Visitor, NodePath } from "./ast";
import { TypeChecker } from "./type-checker";
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
      onMatch: (path: NodePath) => void,
      typeChecker: TypeChecker
    ) => Visitor;
    updateMessage?: (path: NodePath) => string;
  };
}

export type Operation = (editor: Editor) => Promise<void>;
