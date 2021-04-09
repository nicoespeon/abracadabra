import {
  Editor,
  Code,
  Modification,
  Command,
  ErrorReason,
  Choice,
  Result,
  RelativePath
} from "../editor";
import { Selection } from "../selection";
import { Position } from "../position";

export { InMemoryEditor };

const LINE_SEPARATOR = "\n";
const CHARS_SEPARATOR = "";
const DELETED_LINE = "___DELETED_LINE___";
const CURSOR = "[cursor]";
const SELECTION_START = "[start]";
const SELECTION_END = "[end]";

class InMemoryEditor implements Editor {
  private codeMatrix: CodeMatrix = [];
  private _selection: Selection = Selection.cursorAt(0, 0);
  private otherFiles = new Map<RelativePath, Editor>();

  constructor(code: Code, position: Position = new Position(0, 0)) {
    this.setCodeMatrix(code);
    this.setSelectionFromCursor(code, Selection.cursorAtPosition(position));
  }

  async workspaceFiles(): Promise<RelativePath[]> {
    return Array.from(this.otherFiles.keys());
  }

  get code(): Code {
    return this.read(this.codeMatrix);
  }

  async codeOf(path: RelativePath): Promise<Code> {
    const otherFile = this.otherFiles.get(path);
    if (!otherFile) return "";

    return otherFile.code;
  }

  get selection(): Selection {
    return this._selection;
  }

  get position() {
    return this.selection.start;
  }

  write(code: Code, newCursorPosition?: Position): Promise<void> {
    this.setCodeMatrix(code);
    if (newCursorPosition) {
      this._selection = Selection.cursorAtPosition(newCursorPosition);
    }
    return Promise.resolve();
  }

  async writeIn(path: RelativePath, code: Code): Promise<void> {
    this.otherFiles.set(path, new InMemoryEditor(code));
  }

  readThenWrite(
    selection: Selection,
    getModifications: (code: Code) => Modification[],
    newCursorPosition?: Position
  ): Promise<void> {
    if (newCursorPosition) {
      this._selection = Selection.cursorAtPosition(newCursorPosition);
    }
    const { start, end } = selection;

    let readCodeMatrix: CodeMatrix = [];
    if (start.line === end.line) {
      readCodeMatrix = [
        this.codeMatrix[start.line].slice(start.character, end.character)
      ];
    } else if (end.line > start.line) {
      readCodeMatrix = [this.codeMatrix[start.line].slice(start.character)];

      // Keep all lines in between selection
      for (let i = start.line + 1; i < end.line; i++) {
        readCodeMatrix.push(this.codeMatrix[i]);
      }

      readCodeMatrix.push(this.codeMatrix[end.line].slice(0, end.character));
    }

    getModifications(this.read(readCodeMatrix))
      // Start with right-most modifications so selection isn't messed up.
      .sort((a, b) => (a.selection.startsBefore(b.selection) ? 1 : -1))
      .forEach(({ code, selection }) => {
        const { start, end } = selection;

        if (start.line === end.line) {
          // Replace selected code with updated code.
          this.codeMatrix[start.line].splice(
            start.character,
            end.character - start.character,
            code
          );
        } else if (end.line > start.line) {
          // Replace selected code with updated code.
          this.codeMatrix[start.line].splice(
            start.character,
            this.codeMatrix[start.line].length - start.character,
            code
          );

          // Merge the rest of the last line.
          this.codeMatrix[start.line].push(
            ...this.codeMatrix[end.line].slice(end.character)
          );

          // Delete all lines in between selection
          for (let i = start.line + 1; i <= end.line; i++) {
            this.codeMatrix[i] = [DELETED_LINE];
          }
        }
      });

    return Promise.resolve();
  }

  delegate(_command: Command) {
    return Promise.resolve(Result.OK);
  }

  showError(_reason: ErrorReason) {
    return Promise.resolve();
  }

  askUserChoice<T>(
    choices: Choice<T>[],
    _placeHolder?: string
  ): Promise<Choice<T> | undefined> {
    return Promise.resolve(choices[0]);
  }

  askUserInput(defaultValue?: string): Promise<string | undefined> {
    return Promise.resolve(defaultValue);
  }

  moveCursorTo(_position: Position) {
    return Promise.resolve();
  }

  private setCodeMatrix(code: Code) {
    this.codeMatrix = code
      .split(LINE_SEPARATOR)
      .map((line) => line.replace(CURSOR, ""))
      .map((line) => line.replace(SELECTION_START, ""))
      .map((line) => line.replace(SELECTION_END, ""))
      .map((line) => line.split(CHARS_SEPARATOR));
  }

  private setSelectionFromCursor(
    code: Code,
    defaultSelection: Selection
  ): void {
    let lineIndex = 0;

    this._selection = code.split(LINE_SEPARATOR).reduce((selection, line) => {
      const cursorChar = line.indexOf(CURSOR);
      if (cursorChar > -1) {
        selection = Selection.cursorAt(lineIndex, cursorChar);
      }
      line = line.replace(CURSOR, "");

      const startChar = line.indexOf(SELECTION_START);
      if (startChar > -1) {
        selection = Selection.cursorAt(lineIndex, startChar);
      }
      line = line.replace(SELECTION_START, "");

      const endChar = line.indexOf(SELECTION_END);
      if (endChar > -1) {
        selection = selection.extendEndToStartOf(
          Selection.cursorAt(lineIndex, endChar)
        );
      }
      line = line.replace(SELECTION_END, "");

      lineIndex++;

      return selection;
    }, defaultSelection);
  }

  private read(codeMatrix: CodeMatrix): string {
    return codeMatrix
      .map((line) => line.join(CHARS_SEPARATOR))
      .filter((line) => line !== DELETED_LINE)
      .join(LINE_SEPARATOR);
  }

  isLineBlank(line: number): boolean {
    return this.codeMatrix[line].join(CHARS_SEPARATOR).trim() === "";
  }

  removeLine(line: number): void {
    this.codeMatrix.splice(line, 1);
  }
}

type CodeMatrix = Line[];
type Line = Char[];
type Char = string;
