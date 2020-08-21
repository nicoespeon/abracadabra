import {
  Editor,
  Code,
  Modification,
  Command,
  ErrorReason,
  Choice
} from "../editor";
import { Selection } from "../selection";
import { Position } from "../position";

export { InMemoryEditor };

const LINE_SEPARATOR = "\n";
const CHARS_SEPARATOR = "";
const DELETED_LINE = "___DELETED_LINE___";
const CURSOR = "[cursor]";

class InMemoryEditor implements Editor {
  private codeMatrix: CodeMatrix = [];
  private _position: Position;

  constructor(code: Code, position: Position = new Position(0, 0)) {
    this.setCodeMatrix(code);
    this.setPositionFromCursor(code, position);
  }

  get code(): Code {
    return this.read(this.codeMatrix);
  }

  get selection(): Selection {
    return Selection.cursorAtPosition(this._position);
  }

  get position() {
    return this._position;
  }

  write(code: Code, newCursorPosition?: Position): Promise<void> {
    this.setCodeMatrix(code);
    if (newCursorPosition) this._position = newCursorPosition;
    return Promise.resolve();
  }

  readThenWrite(
    selection: Selection,
    getModifications: (code: Code) => Modification[],
    newCursorPosition?: Position
  ): Promise<void> {
    if (newCursorPosition) this._position = newCursorPosition;
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

    // Since we insert updates progressively as new elements, keep track
    // of them so we can indent properly.
    const previousUpdatesOnLine: { [key: number]: number } = {};
    getModifications(this.read(readCodeMatrix)).forEach(
      ({ code, selection }) => {
        const { start, end } = selection;

        if (!previousUpdatesOnLine[start.line]) {
          previousUpdatesOnLine[start.line] = 0;
        }

        if (start.line === end.line) {
          // Replace selected code with updated code.
          this.codeMatrix[start.line].splice(
            start.character + previousUpdatesOnLine[start.line],
            end.character - start.character,
            code
          );
        } else if (end.line > start.line) {
          // Replace selected code with updated code.
          this.codeMatrix[start.line].splice(
            start.character + previousUpdatesOnLine[start.line],
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

        previousUpdatesOnLine[start.line] += 1;
      }
    );

    return Promise.resolve();
  }

  delegate(_command: Command) {
    return Promise.resolve();
  }

  showError(_reason: ErrorReason) {
    return Promise.resolve();
  }

  askUser<T>(choices: Choice<T>[]): Promise<Choice<T> | undefined> {
    return Promise.resolve(choices[0]);
  }

  moveCursorTo(_position: Position) {
    return Promise.resolve();
  }

  private setCodeMatrix(code: Code) {
    this.codeMatrix = code
      .split(LINE_SEPARATOR)
      .map((line) => line.replace(CURSOR, ""))
      .map((line) => line.split(CHARS_SEPARATOR));
  }

  private setPositionFromCursor(code: Code, defaultPosition: Position): void {
    let cursorLine = 0;

    this._position = code.split(LINE_SEPARATOR).reduce((newPosition, line) => {
      const cursorChar = line.indexOf(CURSOR);
      if (cursorChar > -1) {
        return new Position(cursorLine, cursorChar);
      }

      cursorLine++;

      return newPosition;
    }, defaultPosition);
  }

  private read(codeMatrix: CodeMatrix): string {
    return codeMatrix
      .map((line) => line.join(CHARS_SEPARATOR))
      .filter((line) => line !== DELETED_LINE)
      .join(LINE_SEPARATOR);
  }
}

type CodeMatrix = Line[];
type Line = Char[];
type Char = string;
