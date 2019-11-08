import { Code, Editor } from "./editor/editor";
import { Selection } from "./editor/selection";

export { Refactoring, RefactoringWithActionProvider, Operation };

interface Refactoring {
  commandKey: string;
  operation: Operation;
}

interface RefactoringWithActionProvider extends Refactoring {
  title: string;
  actionProviderMessage: string;
  canPerformRefactoring: (code: Code, selection: Selection) => boolean;
  isPreferred?: boolean;
}

type Operation = (
  code: Code,
  selection: Selection,
  write: Editor
) => Promise<void>;
