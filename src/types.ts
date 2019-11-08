import { Code } from "./editor/editor";
import { Selection } from "./editor/selection";

import { Operation } from "./commands";

export { Refactoring, RefactoringWithActionProvider };

interface Refactoring {
  commandKey: string;
  operation: Operation;
  title: string;
  isPreferred?: boolean;
}

interface RefactoringWithActionProvider extends Refactoring {
  actionProviderMessage: string;
  canPerformRefactoring: (code: Code, selection: Selection) => boolean;
}
