import * as vscode from "vscode";
import { Decoration, Source } from "../../highlights/highlights";
import { HighlightsRepository } from "../../highlights/highlights-repository";
import { getIgnoredFolders } from "../../vscode-configuration";
import { CodeReference } from "../code-reference";
import { COLORS } from "../colors";
import {
  Choice,
  Code,
  Command,
  Editor,
  ErrorReason,
  errorReasonToString,
  Modification,
  Result,
  SelectedPosition
} from "../editor";
import { AbsolutePath, Path } from "../path";
import { Position } from "../position";
import { Selection } from "../selection";
import {
  AddSourceChange,
  DeleteSourceChange,
  SourceChange
} from "../source-change";
import { createChangeSignatureWebviewTemplate } from "./change-signature-webview/createChangeSignatureWebviewTemplate";

// Persist the instance across all editors.
const highlightsRepository = new HighlightsRepository();
const vscodeDecorations = new Map<
  Decoration,
  vscode.TextEditorDecorationType
>();

export class VSCodeEditor implements Editor {
  private editor: vscode.TextEditor;
  private document: vscode.TextDocument;
  public static panel: vscode.WebviewPanel | null = null;

  constructor(editor: vscode.TextEditor) {
    this.editor = editor;
    this.document = editor.document;
  }

  async workspaceFiles(): Promise<Path[]> {
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

  async codeOf(path: Path): Promise<Code> {
    const fileUri = this.fileUriAt(path);
    // Get file content even if user does not save last changes
    const doc = await vscode.workspace.openTextDocument(fileUri);

    return doc.getText();
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

  async writeIn(path: Path, code: Code): Promise<void> {
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

  protected fileUriAt(path: Path): vscode.Uri {
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

  private get filePath(): string {
    return this.document.uri.toString();
  }

  highlightSourcesForCurrentFile(): Selection[] {
    return highlightsRepository.get(this.filePath)?.sources() ?? [];
  }

  findHighlight(selection: Selection): Source | undefined {
    return highlightsRepository.findHighlightsSource(this.filePath, selection);
  }

  highlight(source: Source, bindings: Selection[]): void {
    const decoration = highlightsRepository.saveAndIncrement(
      this.filePath,
      source,
      bindings
    );

    const selections = [source, ...bindings];
    const vscodeDecoration = this.toVSCodeDecoration(decoration);
    this.editor.setDecorations(vscodeDecoration, selections.map(toVSCodeRange));
    vscodeDecorations.set(decoration, vscodeDecoration);
  }

  private toVSCodeDecoration(
    decoration: Decoration
  ): vscode.TextEditorDecorationType {
    const color = COLORS[decoration % COLORS.length];
    return vscode.window.createTextEditorDecorationType({
      light: {
        border: `1px solid ${color.light}`,
        color: color.lightText,
        backgroundColor: color.light,
        overviewRulerColor: color.light
      },
      dark: {
        border: `1px solid ${color.dark}`,
        color: color.darkText,
        backgroundColor: color.dark,
        overviewRulerColor: color.dark
      },
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      // We will recompute the proper highlights on update
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
    });
  }

  removeHighlight(source: Source): void {
    const decoration = highlightsRepository.decorationOf(this.filePath, source);
    if (decoration === undefined) return;

    this.disposeDecoration(decoration);
    highlightsRepository.removeHighlightsOfFile(this.filePath, source);
  }

  private disposeDecoration(decoration: Decoration): void {
    vscodeDecorations.get(decoration)?.dispose();
    vscodeDecorations.delete(decoration);
  }

  removeAllHighlights(): void {
    vscodeDecorations.forEach((decoration) => decoration.dispose());
    vscodeDecorations.clear();
    highlightsRepository.removeAllHighlights();
  }

  static restoreHighlightDecorations(editor: vscode.TextEditor) {
    const filePath = editor.document.uri.toString();
    const existingHighlights = highlightsRepository.get(filePath);
    if (!existingHighlights) return;

    existingHighlights
      .entries()
      .forEach(([source, { bindings, decoration }]) => {
        const vscodeDecoration = vscodeDecorations.get(decoration);
        if (!vscodeDecoration) return;

        const selections = [source, ...bindings];
        editor.setDecorations(vscodeDecoration, selections.map(toVSCodeRange));
      });
  }

  static renameHighlightsFilePath(event: vscode.FileWillRenameEvent) {
    event.files.forEach((file) => {
      const existingHighlights = highlightsRepository.get(
        file.oldUri.toString()
      );
      if (!existingHighlights) return;

      highlightsRepository.set(file.newUri.toString(), existingHighlights);
      highlightsRepository.removeAllHighlightsOfFile(file.oldUri.toString());
    });
  }

  static async repositionHighlights(event: vscode.TextDocumentChangeEvent) {
    const filePath = event.document.uri.toString();
    event.contentChanges.forEach((contentChange) => {
      createSourceChanges(contentChange).map((change) =>
        highlightsRepository.repositionHighlights(filePath, change)
      );
    });
  }

  async getSelectionReferences(selection: Selection): Promise<CodeReference[]> {
    const locations = (await vscode.commands.executeCommand(
      "vscode.executeReferenceProvider",
      this.document.uri,
      selection.start
    )) as vscode.Location[];

    return locations.map((loc) => {
      const path = new AbsolutePath(loc.uri.path);
      const codeReferenceSelection = createSelectionFromVSCode(loc.range);

      return new CodeReference(path, codeReferenceSelection);
    });
  }

  async askForPositions(
    params: SelectedPosition[],
    onConfirm: (positions: SelectedPosition[]) => Promise<void>
  ): Promise<void> {
    if (VSCodeEditor.panel !== null) {
      VSCodeEditor.panel.dispose();
    }

    VSCodeEditor.panel = vscode.window.createWebviewPanel(
      "changeSignature",
      "Change function signature",
      vscode.ViewColumn.Beside,
      {}
    );

    VSCodeEditor.panel.webview.options = {
      enableScripts: true
    };
    VSCodeEditor.panel.webview.html =
      createChangeSignatureWebviewTemplate(params);

    VSCodeEditor.panel.webview.onDidReceiveMessage(
      async (message: {
        values: {
          label: string;
          startAt: number;
          endAt: number;
          value?: string;
        }[];
      }) => {
        const values = message.values;

        const result: SelectedPosition[] = values.map((result) => {
          return {
            label: result.label,
            value: {
              startAt: result.startAt,
              endAt: result.endAt,
              val: result.value
            }
          };
        });

        await onConfirm(result);
        VSCodeEditor.panel?.dispose();
        VSCodeEditor.panel = null;
      },
      undefined
    );

    VSCodeEditor.panel.onDidDispose(() => {
      VSCodeEditor.panel = null;
    });
  }
}

function createSourceChanges(
  change: vscode.TextDocumentContentChangeEvent
): SourceChange[] {
  const selection = createSelectionFromVSCode(change.range);

  if (change.text.length === 0) {
    return [new DeleteSourceChange(selection)];
  }

  if (selection.isEmpty) {
    return [new AddSourceChange(selection.extendToCode(change.text))];
  }

  return [
    new DeleteSourceChange(selection),
    new AddSourceChange(
      Selection.cursorAtPosition(selection.start).extendToCode(change.text)
    )
  ];
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
