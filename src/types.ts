import { Code } from "./editor/editor";
import { Selection } from "./editor/selection";

import { Operation } from "./commands";

export { Refactoring, RefactoringWithActionProvider };

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
