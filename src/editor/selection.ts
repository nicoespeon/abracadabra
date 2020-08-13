import { Position } from "./position";
import * as ast from "../ast";
import { ASTSelection } from "../ast";

export { Selection };

class Selection {
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

  static areEqual(
    pathA: ast.SelectablePath,
    pathB: ast.SelectablePath
  ): boolean {
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

  isEmpty(): boolean {
    return this.start.isEqualTo(this.end);
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

  isInsidePath(path: ast.NodePath): path is ast.SelectablePath {
    return this.isInsideNode(path.node);
  }

  isInsideNode(node: ast.Node): node is ast.SelectableNode {
    return (
      ast.isSelectableNode(node) && this.isInside(Selection.fromAST(node.loc))
    );
  }

  isInside(selection: Selection): boolean {
    return (
      this.start.isAfter(selection.start) && this.end.isBefore(selection.end)
    );
  }

  isStrictlyInsidePath(path: ast.NodePath): path is ast.SelectablePath {
    return this.isStrictlyInsideNode(path.node);
  }

  isStrictlyInsideNode(node: ast.Node): node is ast.SelectableNode {
    return (
      ast.isSelectableNode(node) &&
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
}
