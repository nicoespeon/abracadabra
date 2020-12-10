import { Selection } from "./selection";
import { Position } from "./position";
import { ErrorReason, toString } from "./error-reason";

export { Editor };
export {
  Modification,
  Code,
  Path,
  Command,
  Result,
  Choice,
  ErrorReason,
  toString as errorReasonToString
};

interface Editor {
  readonly code: Code;
  codeOf(relativePath: Path): Promise<Code>;
  readonly selection: Selection;
  write(code: Code, newCursorPosition?: Position): Promise<void>;
  readThenWrite(
    selection: Selection,
    getModifications: (code: Code) => Modification[],
    newCursorPosition?: Position
  ): Promise<void>;
  delegate(command: Command): Promise<Result>;
  showError(reason: ErrorReason): Promise<void>;
  askUserInput(defaultValue?: string): Promise<string | undefined>;
  askUserChoice<T>(choices: Choice<T>[]): Promise<Choice<T> | undefined>;
  moveCursorTo(position: Position): Promise<void>;
}

type Modification = {
  code: Code;
  selection: Selection;
};

type Code = string;

type Path = string;

enum Command {
  RenameSymbol
}

enum Result {
  OK,
  NotSupported
}

type Choice<T> = {
  value: T;
  label: string;
};
