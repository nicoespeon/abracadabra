import * as vscode from "vscode";
import { getIgnoredFolders } from "../../vscode-configuration";
import { COLORS } from "../colors";
import {
  Choice,
  Code,
  Command,
  Editor,
  ErrorReason,
  errorReasonToString,
  Modification,
  Result
} from "../editor";
import { Highlights, Source } from "../../highlights/highlights";
import { AbsolutePath, RelativePath } from "../path";
import { Position } from "../position";
import { Selection } from "../selection";

// These should persist across any editor instances.
const highlightsPerFile = new Map<FilePath, Highlights>();
type FilePath = string;
let nextHighlightColorIndex = 0;

export class VSCodeEditor implements Editor {
  private editor: vscode.TextEditor;
  private document: vscode.TextDocument;

  constructor(editor: vscode.TextEditor) {
    this.editor = editor;
    this.document = editor.document;
  }

  static onDidChangeActiveTextEditor(editor: vscode.TextEditor) {
    const existingHighlights = highlightsPerFile.get(
      editor.document.uri.toString()
    );
    if (!existingHighlights) return;

    existingHighlights
      .entries()
      .forEach(([source, { bindings, decoration }]) => {
        const selections = [source, ...bindings];
        editor.setDecorations(decoration, selections.map(toVSCodeRange));
      });
  }

  static onWillRenameFiles(event: vscode.FileWillRenameEvent) {
    event.files.forEach((file) => {
      const existingHighlights = highlightsPerFile.get(file.oldUri.toString());
      if (!existingHighlights) return;

      highlightsPerFile.set(file.newUri.toString(), existingHighlights);
      highlightsPerFile.delete(file.oldUri.toString());
    });
  }

  async workspaceFiles(): Promise<RelativePath[]> {
    const uris = await this.findFileUris();

    return uris
      .map((uri) => new AbsolutePath(uri.path))
      .filter((path) => !path.equals(this.document.uri.path))
      .filter((path) => !path.fileName.endsWith(".d.ts"))
      .map((path) => path.relativeTo(this.document.uri.path));
  }

  protected async findFileUris(): Promise<vscode.Uri[]> {
    const ignoredFoldersGlobPattern = `{${getIgnoredFolders().join(",")}}`;
    return vscode.workspace.findFiles(
      "**/*.{js,jsx,ts,tsx}",
      `**/${ignoredFoldersGlobPattern}/**`
    );
  }

  get code(): Code {
    return this.document.getText();
  }

  async codeOf(path: RelativePath): Promise<Code> {
    const fileUri = this.fileUriAt(path);
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

  async writeIn(path: RelativePath, code: Code): Promise<void> {
    const fileUri = this.fileUriAt(path);
    await VSCodeEditor.ensureFileExists(fileUri);

    const edit = new vscode.WorkspaceEdit();
    const WHOLE_DOCUMENT = new vscode.Range(
      new vscode.Position(0, 0),
      new vscode.Position(Number.MAX_SAFE_INTEGER, 0)
    );
    edit.set(fileUri, [new vscode.TextEdit(WHOLE_DOCUMENT, code)]);
    await vscode.workspace.applyEdit(edit);

    const updatedDocument = await vscode.workspace.openTextDocument(fileUri);
    await updatedDocument.save();
  }

  static async ensureFileExists(fileUri: vscode.Uri) {
    try {
      await vscode.workspace.fs.readFile(fileUri);
    } catch {
      // If file doesn't exist, reading it will throw.
      // We assume that's the only reason it would throw here.
      const NO_CONTENT = new Uint8Array();
      await vscode.workspace.fs.writeFile(fileUri, NO_CONTENT);
    }
  }

  protected fileUriAt(path: RelativePath): vscode.Uri {
    const filePath = path.absoluteFrom(this.document.uri.path);
    return this.document.uri.with({ path: filePath.value });
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

  async askUserChoice<T>(choices: Choice<T>[], placeHolder?: string) {
    return await vscode.window.showQuickPick(
      choices.map(({ label, value, description, icon }) => ({
        label: icon ? `$(${icon}) ${label}` : label,
        value,
        description
      })),
      { placeHolder, matchOnDescription: true }
    );
  }

  async askUserInput(defaultValue?: string) {
    return await vscode.window.showInputBox({ value: defaultValue });
  }

  moveCursorTo(position: Position) {
    this.editor.selection = toVSCodeCursor(position);
    return Promise.resolve();
  }

  get nextHighlightColorIndex() {
    return nextHighlightColorIndex;
  }
  set nextHighlightColorIndex(value: number) {
    nextHighlightColorIndex = value;
  }

  highlight(source: Source, bindings: Selection[]): void {
    const color = COLORS[this.nextHighlightColorIndex % COLORS.length];
    const decoration = vscode.window.createTextEditorDecorationType({
      light: {
        border: `1px solid ${color.light}`,
        backgroundColor: color.light,
        overviewRulerColor: color.light
      },
      dark: {
        border: `1px solid ${color.dark}`,
        backgroundColor: color.dark,
        overviewRulerColor: color.dark
      },
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      // We will recompute the proper highlights on update
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
    });

    const selections = [source, ...bindings];
    this.editor.setDecorations(decoration, selections.map(toVSCodeRange));

    const existingHighlights =
      highlightsPerFile.get(this.document.uri.toString()) ?? new Highlights();
    existingHighlights.set(source, bindings, decoration);
    highlightsPerFile.set(this.document.uri.toString(), existingHighlights);
  }

  removeHighlight(source: Source): void {
    this.removeHighlightOfFile(source, this.document.uri.toString());
  }

  removeAllHighlights(): void {
    Array.from(highlightsPerFile.entries()).forEach(([filePath, highlights]) =>
      highlights
        .sources()
        .forEach((source) => this.removeHighlightOfFile(source, filePath))
    );
  }

  private removeHighlightOfFile(source: Source, filePath: FilePath) {
    const existingHighlights = highlightsPerFile.get(filePath);
    if (!existingHighlights) return;

    const decoration = existingHighlights.decorationOf(source);
    if (decoration) {
      decoration.dispose();
      existingHighlights.delete(source);
      highlightsPerFile.set(filePath, existingHighlights);
    }
  }

  findHighlight(selection: Selection): Source | undefined {
    const existingHighlights = highlightsPerFile.get(
      this.document.uri.toString()
    );
    if (!existingHighlights) return;

    return existingHighlights.entries().find(([source, { bindings }]) => {
      const selections = [source, ...bindings];
      return selections.some((s) => selection.isInside(s));
    })?.[0];
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

function toVSCodeRange(selection: Selection): vscode.Range {
  return new vscode.Range(
    toVSCodePosition(selection.start),
    toVSCodePosition(selection.end)
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
