import { Code, Editor } from "./editor/editor";
import { Selection } from "./editor/selection";
import { AST } from "./ast";

export {
  Refactoring,
  RefactoringWithActionProvider,
  xxxnew_RefactoringWithActionProvider,
  Operation
};

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
    canPerform: (code: Code, selection: Selection) => boolean;
    isPreferred?: boolean;
  };
}

interface xxxnew_RefactoringWithActionProvider extends Refactoring {
  command: {
    key: string;
    title: string;
    operation: Operation;
  };
  actionProvider: {
    message: string;
    canPerform: (ast: AST, selection: Selection) => boolean;
    isPreferred?: boolean;
  };
}

type Operation = (
  code: Code,
  selection: Selection,
  write: Editor
) => Promise<void>;
