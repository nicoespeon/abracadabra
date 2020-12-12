import * as vscode from "vscode";
import * as path from "path";

import {
  Editor,
  Code,
  Modification,
  Command,
  ErrorReason,
  errorReasonToString,
  Choice,
  Result,
  Path
} from "../editor";
import { Selection } from "../selection";
import { Position } from "../position";

export { VSCodeEditor };

class VSCodeEditor implements Editor {
  private editor: vscode.TextEditor;
  private document: vscode.TextDocument;

  constructor(editor: vscode.TextEditor) {
    this.editor = editor;
    this.document = editor.document;
  }

  async workspaceFiles(): Promise<Path[]> {
    // TODO: cache for performance? (need to update it on change though)
    const uris = await vscode.workspace.findFiles(
      // TODO: override by editor for Vue
      "**/*.{js,jsx,ts,tsx,vue}",
      // TODO: check default ignores for our projects
      "**/node_modules/**"
    );

    return uris.map((uri) => path.relative(this.document.uri.path, uri.path));
  }

  get code(): Code {
    return this.document.getText();
  }

  async codeOf(relativePath: Path): Promise<Code> {
    const fileUri = this.fileUriAt(relativePath);
    const file = await vscode.workspace.fs.readFile(fileUri);

    return file.toString();
  }

  get selection(): Selection {
    return createSelectionFromVSCode(this.editor.selection);
  }

  async write(code: Code, newCursorPosition?: Position): Promise<void> {
    // We need to register initial position BEFORE we update the document.
    const cursorAtInitialStartPosition = new vscode.Selection(
      this.editor.selection.start,
      this.editor.selection.start
    );

    const edit = new vscode.WorkspaceEdit();
    edit.set(this.document.uri, [new vscode.TextEdit(this.editRange, code)]);
    await vscode.workspace.applyEdit(edit);

    // Put cursor at correct position
    this.editor.selection = newCursorPosition
      ? toVSCodeCursor(newCursorPosition)
      : cursorAtInitialStartPosition;

    // Scroll to correct position if it changed
    if (newCursorPosition) {
      const position = toVSCodePosition(newCursorPosition);
      this.editor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.Default
      );
    }
  }

  async writeIn(relativePath: Path, code: Code): Promise<void> {
    const edit = new vscode.WorkspaceEdit();
    const fileUri = this.fileUriAt(relativePath);
    const WHOLE_DOCUMENT = new vscode.Range(
      new vscode.Position(0, 0),
      new vscode.Position(Infinity, 0)
    );
    edit.set(fileUri, [new vscode.TextEdit(WHOLE_DOCUMENT, code)]);
    await vscode.workspace.applyEdit(edit);
  }

  private fileUriAt(relativePath: string) {
    const filePath = path.join(
      path.dirname(this.document.uri.path),
      relativePath
    );
    return this.document.uri.with({ path: filePath });
  }

  protected get editRange(): vscode.Range {
    return new vscode.Range(
      new vscode.Position(0, 0),
      new vscode.Position(this.document.lineCount, 0)
    );
  }

  async readThenWrite(
    selection: Selection,
    getModifications: (code: Code) => Modification[],
    newCursorPosition?: Position
  ): Promise<void> {
    const startPosition = toVSCodePosition(selection.start);
    const endPosition = toVSCodePosition(selection.end);

    const readCode = this.document.getText(
      new vscode.Range(startPosition, endPosition)
    );

    const textEdits = getModifications(readCode).map(({ code, selection }) => {
      const startPosition = toVSCodePosition(selection.start);
      const endPosition = toVSCodePosition(selection.end);

      return new vscode.TextEdit(
        new vscode.Range(startPosition, endPosition),
        code
      );
    });

    const edit = new vscode.WorkspaceEdit();
    edit.set(this.document.uri, textEdits);

    await vscode.workspace.applyEdit(edit);

    if (newCursorPosition) {
      this.editor.selection = toVSCodeCursor(newCursorPosition);
    }
  }

  async delegate(command: Command) {
    await vscode.commands.executeCommand(toVSCodeCommand(command));
    return Result.OK;
  }

  async showError(reason: ErrorReason) {
    await vscode.window.showErrorMessage(errorReasonToString(reason));
  }

  async askUserChoice<T>(choices: Choice<T>[]) {
    return await vscode.window.showQuickPick(choices);
  }

  async askUserInput(defaultValue?: string) {
    return await vscode.window.showInputBox({ value: defaultValue });
  }

  moveCursorTo(position: Position) {
    this.editor.selection = toVSCodeCursor(position);
    return Promise.resolve();
  }
}

function createSelectionFromVSCode(
  selection: vscode.Selection | vscode.Range
): Selection {
  return new Selection(
    [selection.start.line, selection.start.character],
    [selection.end.line, selection.end.character]
  );
}

function toVSCodeCursor(position: Position): vscode.Selection {
  return new vscode.Selection(
    toVSCodePosition(position),
    toVSCodePosition(position)
  );
}

function toVSCodePosition(position: Position): vscode.Position {
  return new vscode.Position(position.line, position.character);
}

function toVSCodeCommand(command: Command): string {
  switch (command) {
    case Command.RenameSymbol:
      return "editor.action.rename";

    default:
      return "";
  }
}
