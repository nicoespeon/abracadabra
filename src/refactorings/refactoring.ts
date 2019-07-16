import { Code, Write } from "../editor/i-write-code";
import { Selection } from "../editor/selection";
import { ShowErrorMessage } from "../editor/i-show-error-message";

export { Refactoring };

type Refactoring = (
  code: Code,
  selection: Selection,
  write: Write,
  showErrorMessage: ShowErrorMessage
) => Promise<void>;
