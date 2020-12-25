import {
  Choice,
  Code,
  Command,
  Editor,
  ErrorReason,
  Modification,
  RelativePath
} from "../editor";
import { Position } from "../position";
import { Selection } from "../selection";

export { AttemptingEditor };

class AttemptingEditor implements Editor {
  attemptSucceeded = true;

  constructor(private editor: Editor, private expectedReason: ErrorReason) {}

  workspaceFiles(): Promise<RelativePath[]> {
    return this.editor.workspaceFiles();
  }

  get code(): Code {
    return this.editor.code;
  }

  codeOf(path: RelativePath): Promise<Code> {
    return this.editor.codeOf(path);
  }

  get selection(): Selection {
    return this.editor.selection;
  }

  write(code: Code, newCursorPosition?: Position): Promise<void> {
    return this.editor.write(code, newCursorPosition);
  }

  writeIn(path: RelativePath, code: Code): Promise<void> {
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
}
