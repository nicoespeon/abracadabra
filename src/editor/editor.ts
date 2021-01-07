import { Selection } from "./selection";
import { AbsolutePath, RelativePath } from "./path";
import { Position } from "./position";
import { ErrorReason, toString } from "./error-reason";

export { Editor };
export {
  Modification,
  Code,
  AbsolutePath,
  RelativePath,
  Command,
  Result,
  Choice,
  ErrorReason,
  toString as errorReasonToString
};

interface Editor {
  workspaceFiles(): Promise<RelativePath[]>;
  readonly selection: Selection;
  readonly code: Code;
  codeOf(path: RelativePath): Promise<Code>;
  write(code: Code, newCursorPosition?: Position): Promise<void>;
  writeIn(path: RelativePath, code: Code): Promise<void>;
  readThenWrite(
    selection: Selection,
    getModifications: (code: Code) => Modification[],
    newCursorPosition?: Position
  ): Promise<void>;
  delegate(command: Command): Promise<Result>;
  showError(reason: ErrorReason): Promise<void>;
  askUserInput(defaultValue?: string): Promise<string | undefined>;
  askUserChoice<T>(
    choices: Choice<T>[],
    placeHolder?: string
  ): Promise<Choice<T> | undefined>;
  moveCursorTo(position: Position): Promise<void>;
}

type Modification = {
  code: Code;
  selection: Selection;
};

type Code = string;

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
  description?: string;
  icon?: "file-code";
};
