import { Code } from "./editor/editor";
import { Selection } from "./editor/selection";

export { Refactoring, RefactoringWithActionProvider };

interface Refactoring {
  commandKey: string;
  title: string;
  isPreferred?: boolean;
}

interface RefactoringWithActionProvider extends Refactoring {
  actionProviderMessage: string;
  canPerformRefactoring: (code: Code, selection: Selection) => boolean;
}
