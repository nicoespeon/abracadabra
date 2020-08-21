import { Code, Editor } from "./editor/editor";
import { Selection } from "./editor/selection";
import { Visitor, NodePath } from "./ast";

export {
  DeprecatedRefactoring,
  DeprecatedRefactoringWithActionProvider,
  DeprecatedOperation
};

interface DeprecatedRefactoring {
  command: {
    key: string;
    operation: DeprecatedOperation;
  };
}

interface DeprecatedRefactoringWithActionProvider {
  command: {
    key: string;
    title: string;
    operation: DeprecatedOperation;
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

type DeprecatedOperation = (
  code: Code,
  selection: Selection,
  editor: Editor
) => Promise<void>;
