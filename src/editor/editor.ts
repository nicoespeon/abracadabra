import { Selection } from "./selection";
import { Position } from "./position";
import { ErrorReason, toString } from "./error-reason";

export { Editor };
export { Update, Code, Command, ErrorReason, toString as errorReasonToString };

interface Editor {
  write: (code: Code, newCursorPosition?: Position) => Promise<void>;
  readThenWrite: (
    selection: Selection,
    getUpdates: (code: Code) => Update[],
    newCursorPosition?: Position
  ) => Promise<void>;
  delegate: (command: Command) => Promise<void>;
  showError: (reason: ErrorReason) => Promise<void>;
}

interface Update {
  code: Code;
  selection: Selection;
}

type Code = string;

enum Command {
  RenameSymbol
}
