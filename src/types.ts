import { Editor } from "./editor/editor";
import { Selection } from "./editor/selection";
import { Visitor, NodePath } from "./ast";
import { TypeChecker } from "./type-checker";

export { Refactoring, RefactoringWithActionProvider, Operation };

interface Refactoring {
  command: {
    key: string;
    operation: Operation;
  };
}

interface RefactoringWithActionProvider {
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

type Operation = (editor: Editor) => Promise<void>;
