import { Source } from "../../highlights/highlights";
import { CodeReference } from "../code-reference";
import {
  Choice,
  Code,
  Command,
  Editor,
  ErrorReason,
  Modification,
  SelectedPosition
} from "../editor";
import { Path } from "../path";
import { Position } from "../position";
import { Selection } from "../selection";

export class AttemptingEditor implements Editor {
  attemptSucceeded = true;

  constructor(private editor: Editor, private expectedReason: ErrorReason) {}

  workspaceFiles(): Promise<Path[]> {
    return this.editor.workspaceFiles();
  }

  get code(): Code {
    return this.editor.code;
  }

  codeOf(path: Path): Promise<Code> {
    return this.editor.codeOf(path);
  }

  get selection(): Selection {
    return this.editor.selection;
  }

  write(code: Code, newCursorPosition?: Position): Promise<void> {
    return this.editor.write(code, newCursorPosition);
  }

  writeIn(path: Path, code: Code): Promise<void> {
    return this.editor.writeIn(path, code);
  }

  readThenWrite(
    selection: Selection,
    getModifications: (code: Code) => Modification[],
    newCursorPosition?: Position
  ): Promise<void> {
    return this.editor.readThenWrite(
      selection,
      getModifications,
      newCursorPosition
    );
  }

  delegate(command: Command) {
    return this.editor.delegate(command);
  }

  async showError(reason: ErrorReason) {
    if (reason === this.expectedReason) {
      this.attemptSucceeded = false;
      return Promise.resolve();
    }

    await this.editor.showError(reason);
  }

  askUserChoice<T>(
    choices: Choice<T>[],
    placeHolder?: string
  ): Promise<Choice<T> | undefined> {
    return this.editor.askUserChoice(choices, placeHolder);
  }

  askUserInput(defaultValue?: string) {
    return this.editor.askUserInput(defaultValue);
  }

  moveCursorTo(position: Position): Promise<void> {
    return this.editor.moveCursorTo(position);
  }

  highlightSourcesForCurrentFile(): Selection[] {
    return this.editor.highlightSourcesForCurrentFile();
  }

  highlight(source: Source, bindings: Selection[]) {
    return this.editor.highlight(source, bindings);
  }

  removeHighlight(source: Source) {
    return this.editor.removeHighlight(source);
  }

  removeAllHighlights(): void {
    return this.editor.removeAllHighlights();
  }

  findHighlight(selection: Selection): Source | undefined {
    return this.editor.findHighlight(selection);
  }

  getSelectionReferences(selection: Selection): Promise<CodeReference[]> {
    return this.editor.getSelectionReferences(selection);
  }

  async askForPositions(
    params: SelectedPosition[],
    onConfirm: (positions: SelectedPosition[]) => Promise<void>
  ): Promise<void> {
    await this.editor.askForPositions(params, onConfirm);
  }
}
