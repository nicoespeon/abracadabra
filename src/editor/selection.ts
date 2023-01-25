import * as t from "../ast";
import { ASTSelection } from "../ast";
import { Code } from "./editor";
import { Position } from "./position";

export class Selection {
  private _start: Position;
  private _end: Position;

  constructor([startLine, startChar]: number[], [endLine, endChar]: number[]) {
    this._start = new Position(startLine, startChar);
    this._end = new Position(endLine, endChar);
  }

  static fromPositions(start: Position, end: Position): Selection {
    return new Selection(
      [start.line, start.character],
      [end.line, end.character]
    );
  }

  static fromAST(astSelection: ASTSelection): Selection {
    return Selection.fromPositions(
      Position.fromAST(astSelection.start),
      Position.fromAST(astSelection.end)
    );
  }

  static cursorAt(line: number, char: number): Selection {
    return new Selection([line, char], [line, char]);
  }

  static cursorAtPosition(position: Position): Selection {
    return Selection.fromPositions(position, position);
  }

  static areEqual(pathA: t.SelectablePath, pathB: t.SelectablePath): boolean {
    return Selection.fromAST(pathA.node.loc).isEqualTo(
      Selection.fromAST(pathB.node.loc)
    );
  }

  get start(): Position {
    return this._start;
  }

  get end(): Position {
    return this._end;
  }

  get isMultiLines(): boolean {
    return !this.start.isSameLineThan(this.end);
  }

  get isOneLine(): boolean {
    return !this.isMultiLines;
  }

  get height(): number {
    return this.end.line - this.start.line;
  }

  get width(): number {
    // Maybe this only make sense for single-line selections though…
    return this.end.character - this.start.character;
  }

  get isCursorAtTopOfDocument(): boolean {
    return this.isEqualTo(Selection.cursorAt(0, 0));
  }

  get isEmpty(): boolean {
    return this.start.isEqualTo(this.end);
  }

  extendToCode(code: Code): Selection {
    const codeMatrix = code.split("\n");
    const codeHeight = Math.max(codeMatrix.length - 1, 0);
    const lastLineLength = codeMatrix[codeHeight]?.length ?? 0;
    const end =
      codeHeight === 0
        ? this.end.addCharacters(lastLineLength)
        : this.end
            .addLines(codeHeight)
            .putAtStartOfLine()
            .addCharacters(lastLineLength);

    return Selection.fromPositions(this.start, end);
  }

  extendToStartOfLine(): Selection {
    return Selection.fromPositions(this.start.putAtStartOfLine(), this.end);
  }

  extendToEndOfLine(): Selection {
    return Selection.fromPositions(this.start, this.end.putAtEndOfLine());
  }

  extendToStartOfNextLine(): Selection {
    return Selection.fromPositions(
      this.start,
      this.end.putAtNextLine().putAtStartOfLine()
    );
  }

  extendStartToEndOf(selection: Selection): Selection {
    return selection.end.isBefore(this.start)
      ? Selection.fromPositions(selection.end, this.end)
      : this;
  }

  extendStartToStartOf(selection: Selection): Selection {
    return selection.start.isBefore(this.start)
      ? Selection.fromPositions(selection.start, this.end)
      : this;
  }

  extendEndToStartOf(selection: Selection): Selection {
    return selection.start.isAfter(this.end)
      ? Selection.fromPositions(this.start, selection.start)
      : this;
  }

  extendEndToEndOf(selection: Selection): Selection {
    return selection.end.isAfter(this.end)
      ? Selection.fromPositions(this.start, selection.end)
      : this;
  }

  mergeWith(selection: Selection): Selection[] {
    if (!this.overlapsWith(selection)) {
      return [this, selection];
    }

    if (this.isInside(selection)) {
      return [selection];
    }

    if (selection.isInside(this)) {
      return [this];
    }

    if (this.start.isAfter(selection.start)) {
      return [Selection.fromPositions(selection.start, this.end)];
    }

    return [Selection.fromPositions(this.start, selection.end)];
  }

  exclude(selection: Selection): Selection[] {
    if (!this.overlapsWith(selection)) {
      return [this];
    }

    if (this.isInside(selection)) {
      return [];
    }

    if (selection.isInside(this)) {
      return [
        Selection.fromPositions(this.start, selection.start),
        Selection.fromPositions(selection.end, this.end)
      ];
    }

    if (this.start.isAfter(selection.start)) {
      return [Selection.fromPositions(selection.end, this.end)];
    }

    return [Selection.fromPositions(this.start, selection.start)];
  }

  isInsidePath<T extends t.Node>(
    path: t.NodePath<T>
  ): path is t.SelectablePath<T> {
    // It seems a function declaration inside a named export may have no loc.
    // Use the named export loc in that situation.
    if (t.isExportDeclaration(path.parent) && !t.isSelectableNode(path.node)) {
      path.node.loc = path.parent.loc;
    }

    return this.isInsideNode(path.node);
  }

  isInsideNode(node: t.Node): node is t.SelectableNode {
    return (
      t.isSelectableNode(node) && this.isInside(Selection.fromAST(node.loc))
    );
  }

  isInside(selection: Selection): boolean {
    return (
      this.start.isAfter(selection.start) && this.end.isBefore(selection.end)
    );
  }

  isStrictlyInsidePath(path: t.NodePath): path is t.SelectablePath {
    return this.isStrictlyInsideNode(path.node);
  }

  isStrictlyInsideNode(node: t.Node): node is t.SelectableNode {
    return (
      t.isSelectableNode(node) &&
      this.isStrictlyInside(Selection.fromAST(node.loc))
    );
  }

  isStrictlyInside(selection: Selection): boolean {
    return (
      this.isInside(selection) &&
      !this.start.isEqualTo(selection.start) &&
      !this.end.isEqualTo(selection.end)
    );
  }

  isBefore(statement: t.Selectable<t.Statement>): boolean {
    const endOfStatement = Position.fromAST(statement.loc.end);
    return this.start.isBefore(endOfStatement);
  }

  startsBefore(selection: Selection): boolean {
    return this.start.isBefore(selection.start);
  }

  isEqualTo(selection: Selection): boolean {
    return (
      this.start.isEqualTo(selection.start) && this.end.isEqualTo(selection.end)
    );
  }

  isSameLineThan(selection: Selection): boolean {
    return (
      this.start.isSameLineThan(selection.start) &&
      this.end.isSameLineThan(selection.end)
    );
  }

  overlapsWith(selection: Selection): boolean {
    return !(
      this.start.isAfter(selection.end) || this.end.isBefore(selection.start)
    );
  }

  touches(selection: Selection): boolean {
    return (
      this.overlapsWith(selection) ||
      this.start.isEqualTo(selection.end) ||
      this.end.isEqualTo(selection.start)
    );
  }
}
