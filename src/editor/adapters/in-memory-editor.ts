import assert from "assert";
import { Source } from "../../highlights/highlights";
import { HighlightsRepository } from "../../highlights/highlights-repository";
import { CodeReference } from "../code-reference";
import {
  Choice,
  Code,
  Command,
  Editor,
  ErrorReason,
  Modification,
  Result,
  SelectedPosition
} from "../editor";
import { Path } from "../path";
import { Position } from "../position";
import { Selection } from "../selection";
import { AddSourceChange, DeleteSourceChange } from "../source-change";

const LINE_SEPARATOR = "\n";
const CHARS_SEPARATOR = "";
const DELETED_LINE = "___DELETED_LINE___";
const CURSOR = "[cursor]";
const SELECTION_START = "[start]";
const SELECTION_END = "[end]";

export class InMemoryEditor implements Editor {
  private codeMatrix: CodeMatrix = [];
  private _selection: Selection = Selection.cursorAt(0, 0);
  private otherFiles = new Map<Path, Editor>();
  private userChoices: Choice<unknown>[] = [];

  constructor(code: Code, position: Position = new Position(0, 0)) {
    this.setCodeMatrix(code);
    this.setSelectionFromCursor(code, Selection.cursorAtPosition(position));
  }

  async workspaceFiles(): Promise<Path[]> {
    return Array.from(this.otherFiles.keys());
  }

  get code(): Code {
    return this.read(this.codeMatrix);
  }

  get highlightedCode(): Code {
    return this.read(this.highlightCodeMatrix(this.codeMatrix));
  }

  async codeOf(path: Path): Promise<Code> {
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

  insert(code: Code, position: Position): Promise<void> {
    const insertedCode = this.toCodeMatrix(code);
    const newCode: CodeMatrix = [];
    const { line, character } = position;

    // Push the beginning of the original code
    newCode.push(...this.codeMatrix.slice(0, line));

    // Insert code
    const codeLine = this.codeMatrix[line] ?? [];
    newCode.push([...codeLine.slice(0, character), ...(insertedCode[0] ?? [])]);
    for (let j = 1; j < insertedCode.length; j++) {
      newCode.push(insertedCode[j]);
    }
    newCode[newCode.length - 1].push(...codeLine.slice(character));

    // Push the rest of the original code
    newCode.push(...this.codeMatrix.slice(line + 1));

    this.codeMatrix = newCode;

    this.highlightsRepository.repositionHighlights(
      this.filePath,
      new AddSourceChange(
        Selection.cursorAtPosition(position).extendToCode(code)
      )
    );

    return Promise.resolve();
  }

  delete(selection: Selection): Promise<void> {
    this.codeMatrix.forEach((_line, lineIndex) => {
      if (lineIndex < selection.start.line) return;
      if (lineIndex > selection.end.line) return;

      if (selection.start.character === 0 || lineIndex > selection.start.line) {
        if (lineIndex < selection.end.line) {
          // Delete this line
          this.codeMatrix.splice(lineIndex, 1);
          return;
        }
      }

      this.codeMatrix[lineIndex].splice(
        selection.start.character,
        selection.width
      );
    });

    this.highlightsRepository.repositionHighlights(
      this.filePath,
      new DeleteSourceChange(selection)
    );

    return Promise.resolve();
  }

  async writeIn(path: Path, code: Code): Promise<void> {
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

  async moveCursorTo(position: Position) {
    this._selection = Selection.cursorAtPosition(position);
  }

  private setCodeMatrix(code: Code) {
    this.codeMatrix = this.toCodeMatrix(code);
  }

  private toCodeMatrix(code: Code) {
    return code
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

  private highlightCodeMatrix(codeMatrix: CodeMatrix): CodeMatrix {
    const allDecorations = this.highlightsRepository.getAllDecorations(
      this.filePath
    );
    const selections = Array.from(allDecorations.keys());

    return codeMatrix.map((line, lineIndex) => {
      const startSelections = selections.filter(
        ({ start }) => start.line === lineIndex
      );
      const endSelections = selections.filter(
        ({ end }) => end.line === lineIndex
      );

      return line.flatMap((char, charIndex) => {
        const start = startSelections.find(
          ({ start }) => start.character === charIndex
        );
        if (start) {
          const index = allDecorations.get(start);
          assert(typeof index == "number");
          // Add 1 so we start at [h1] instead of [h0].
          return [`[h${index + 1}]`, char];
        }

        const end = endSelections.find(
          ({ end }) => end.character === charIndex
        );
        if (end) {
          const index = allDecorations.get(end);
          assert(typeof index == "number");
          // Add 1 so we start at [h1] instead of [h0].
          return [`[/h${index + 1}]`, char];
        }

        return char;
      });
    });
  }

  isLineBlank(line: number): boolean {
    return this.codeMatrix[line].join(CHARS_SEPARATOR).trim() === "";
  }

  removeLine(line: number): void {
    this.codeMatrix.splice(line, 1);
  }

  private readonly filePath = "irrelevant-path";
  private highlightsRepository = new HighlightsRepository();

  highlightSourcesForCurrentFile(): Selection[] {
    return this.highlightsRepository.get(this.filePath)?.sources() ?? [];
  }

  findHighlight(selection: Selection): Source | undefined {
    return this.highlightsRepository.findHighlightsSource(
      this.filePath,
      selection
    );
  }

  highlight(source: Source, bindings: Selection[]): void {
    this.highlightsRepository.saveAndIncrement(this.filePath, source, bindings);
  }

  removeHighlight(source: Source): void {
    this.highlightsRepository.removeHighlightsOfFile(this.filePath, source);
  }

  removeAllHighlights(): void {
    this.highlightsRepository.removeAllHighlights();
  }

  async getSelectionReferences(selection: Selection): Promise<CodeReference[]> {
    const { start } = selection;
    const endOfFunctionDef = {
      OPEN_PARENTHESIS: "(",
      SPACE_BETWEEN_OPEN_PARENTHESIS: " ",
      ARROW_DEFINITION: "="
    };

    const line = this.codeMatrix[start.line];
    const startLine = line.slice(start.character);

    const endLineIndex = startLine.findIndex((item) => {
      return Object.values(endOfFunctionDef).includes(item);
    });

    const functionReferences = line
      .slice(start.character, start.character + endLineIndex)
      .join("");

    const array = Array.from(this.otherFiles, ([filename, editor]) => ({
      filename,
      editor
    })).filter(({ editor }) => {
      return editor.code.includes(functionReferences);
    });

    const references: CodeReference[] = [];

    array.forEach((obj) => {
      const codeMatrix = this.createPos(obj.editor.code, functionReferences);

      codeMatrix.forEach((pos) => {
        references.push(
          new CodeReference(
            obj.filename,
            new Selection(
              [pos.row - 1, pos.col],
              [pos.row - 1, pos.col + functionReferences.length]
            )
          )
        );
      });
    });

    return references;
  }

  private createPos(str: string, wordToSearch: string) {
    const splittedCode: string[][] = str.split("\n").map((e) => [...e]);
    const items: {
      word: string;
      row: number;
      col: number;
    }[] = [];

    splittedCode.forEach((arr, row) => {
      const word = arr.join("");
      if (word.includes(wordToSearch)) {
        const post = arr.map((_char, col) => {
          const nextWord = arr.slice(col, col + wordToSearch.length).join("");

          return {
            word,
            row: row + 1,
            col: nextWord === wordToSearch ? col : -1
          };
        });

        items.push(...post);
      }
    });

    return items.filter((item) => item.col !== -1);
  }

  async askForPositions(
    _params: SelectedPosition[],
    onConfirm: (positions: SelectedPosition[]) => Promise<void>
  ): Promise<void> {
    await onConfirm(this.userChoices as SelectedPosition[]);
  }

  public saveUserChoices<T>(choice: Choice<T>) {
    this.userChoices.push(choice);
  }
}

type CodeMatrix = Line[];
type Line = Char[];
type Char = string;
