import { Selection } from "./selection";
import { Path } from "./path";
import { Position } from "./position";
import { ErrorReason } from "./error-reason";
import { Source } from "../highlights/highlights";
import { CodeReference } from "./code-reference";

export { AbsolutePath, RelativePath } from "./path";
export { ErrorReason, toString as errorReasonToString } from "./error-reason";

export interface Editor {
  workspaceFiles(): Promise<Path[]>;
  readonly selection: Selection;
  readonly code: Code;
  codeOf(path: Path): Promise<Code>;
  write(code: Code, newCursorPosition?: Position): Promise<void>;
  writeIn(path: Path, code: Code): Promise<void>;
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
  highlightSourcesForCurrentFile(): Selection[];
  findHighlight(selection: Selection): Source | undefined;
  highlight(source: Source, bindings: Selection[]): void;
  removeHighlight(source: Source): void;
  removeAllHighlights(): void;
  getSelectionReferences(selection: Selection): Promise<CodeReference[]>;
  askForPositions(
    params: SelectedPosition[],
    callback: (positions: SelectedPosition[]) => Promise<void>
  ): Promise<void>;
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

export type SelectedPosition = Omit<
  Choice<{
    startAt: number;
    endAt: number;
    val?: string;
  }>,
  "description" | "icon"
>;
