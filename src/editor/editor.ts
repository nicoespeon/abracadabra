import { Selection } from "./selection";
import { RelativePath } from "./path";
import { Position } from "./position";
import { ErrorReason } from "./error-reason";
import { Source } from "./highlights";

export { AbsolutePath, RelativePath } from "./path";
export { ErrorReason, toString as errorReasonToString } from "./error-reason";

export interface Editor {
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
  highlight(source: Source, bindings: Selection[]): void;
  removeHighlight(source: Source): void;
  removeAllHighlights(): void;
  findHighlight(selection: Selection): Source | undefined;
  nextHighlightColorIndex: number;
}

export type Modification = {
  code: Code;
  selection: Selection;
};

export type Code = string;

export enum Command {
  RenameSymbol
}

export enum Result {
  OK,
  NotSupported
}

export type Choice<T> = {
  value: T;
  label: string;
  description?: string;
  icon?: "file-code";
};
