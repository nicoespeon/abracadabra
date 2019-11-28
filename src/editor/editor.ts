import { Selection } from "./selection";
import { Position } from "./position";
import { ErrorReason, toString } from "./error-reason";

export { Editor };
export {
  Modification,
  Code,
  Command,
  Choice,
  ErrorReason,
  toString as errorReasonToString
};

interface Editor {
  write(code: Code, newCursorPosition?: Position): Promise<void>;
  readThenWrite(
    selection: Selection,
    getModifications: (code: Code) => Modification[],
    newCursorPosition?: Position
  ): Promise<void>;
  delegate(command: Command): Promise<void>;
  showError(reason: ErrorReason): Promise<void>;
  askUser<T>(choices: Choice<T>[]): Promise<Choice<T> | undefined>;
}

type Modification = {
  code: Code;
  selection: Selection;
};

type Code = string;

enum Command {
  RenameSymbol
}

type Choice<T> = {
  value: T;
  label: string;
};
