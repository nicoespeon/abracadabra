import {
  Choice,
  Code,
  Command,
  Editor,
  ErrorReason,
  Modification,
  Path
} from "../editor";
import { Position } from "../position";
import { Selection } from "../selection";

export { AttemptingEditor };

class AttemptingEditor implements Editor {
  attemptSucceeded = true;

  constructor(private editor: Editor, private expectedReason: ErrorReason) {}

  get code(): Code {
    return this.editor.code;
  }

  codeOf(relativePath: Path): Promise<Code> {
    return this.editor.codeOf(relativePath);
  }

  get selection(): Selection {
    return this.editor.selection;
  }

  write(code: Code, newCursorPosition?: Position): Promise<void> {
    return this.editor.write(code, newCursorPosition);
  }

  writeIn(relativePath: Path, code: Code): Promise<void> {
    return this.editor.writeIn(relativePath, code);
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

  askUserChoice<T>(choices: Choice<T>[]): Promise<Choice<T> | undefined> {
    return this.editor.askUserChoice(choices);
  }

  askUserInput(defaultValue?: string) {
    return this.editor.askUserInput(defaultValue);
  }

  moveCursorTo(position: Position): Promise<void> {
    return this.editor.moveCursorTo(position);
  }
}
