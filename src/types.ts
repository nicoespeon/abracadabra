import { Code, Editor } from "./editor/editor";
import { Selection } from "./editor/selection";
import { Visitor, NodePath } from "./ast";

export { Refactoring, RefactoringWithActionProvider, Operation };

interface Refactoring {
  command: {
    key: string;
    operation: Operation;
  };
}

interface RefactoringWithActionProvider extends Refactoring {
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
      refactoring: RefactoringWithActionProvider
    ) => Visitor;
    updateMessage?: (path: NodePath) => string;
  };
}

type Operation = (
  code: Code,
  selection: Selection,
  write: Editor
) => Promise<void>;
