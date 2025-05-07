import { Decoration, Source } from "../highlights/highlights";
import { CodeReference } from "./code-reference";
import { ErrorReason } from "./error-reason";
import { Path } from "./path";
import { Position } from "./position";
import { Selection } from "./selection";

export { ErrorReason, toString as errorReasonToString } from "./error-reason";
export { AbsolutePath, RelativePath } from "./path";

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
    newCursorPosition?: Position | Selection
  ): Promise<void>;
  delegate(command: Command): Promise<Result>;
  showError(reason: ErrorReason | string): Promise<void>;
  askUserInput(defaultValue?: string): Promise<string | undefined>;
  askUserChoice<T>(
    choices: Choice<T>[],
    placeHolder?: string
  ): Promise<Choice<T> | undefined>;
  highlightSourcesForCurrentFile(): Selection[];
  findHighlight(selection: Selection): Source | undefined;
  highlight(
    source: Source,
    bindings: Selection[],
    decoration?: Decoration
  ): void;
  removeHighlight(source: Source): Decoration | undefined;
  removeAllHighlights(): void;
  getSelectionReferences(selection: Selection): Promise<CodeReference[]>;
  askForPositions(
    currentPositions: SelectedPosition[]
  ): Promise<SelectedPosition[]>;
}

export type Modification = {
  code: Code;
  selection: Selection;
};

export type Code = string;

export type Command = "rename symbol";

export type Result = "ok" | "not supported";

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

export type CodeChange =
  | { type: "add"; offset: number; text: string }
  | { type: "delete"; offset: number; length: number }
  | { type: "update"; offset: number; length: number; text: string };
