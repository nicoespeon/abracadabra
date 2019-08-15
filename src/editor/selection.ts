import { Position } from "./position";
import * as ast from "../ast";
import { NodePath, ASTSelection } from "../ast";

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

  get start(): Position {
    return this._start;
  }

  get end(): Position {
    return this._end;
  }

  get isMultiLines(): boolean {
    return !this.start.isSameLineThan(this.end);
  }

  get height(): number {
    return this.end.line - this.start.line;
  }

  putCursorAtScopeParentPosition(path: NodePath): Selection {
    const position = this.getScopeParentPosition(path);
    return Selection.fromPositions(position, position);
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

  extendStartTo(selection: Selection): Selection {
    return selection.end.isBefore(this.start)
      ? Selection.fromPositions(selection.end, this.end)
      : this;
  }

  extendEndTo(selection: Selection): Selection {
    return selection.start.isAfter(this.end)
      ? Selection.fromPositions(this.start, selection.start)
      : this;
  }

  getIndentationLevel(path: NodePath): IndentationLevel {
    return this.getScopeParentPosition(path).character;
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

  private getScopeParentPosition(path: NodePath): Position {
    const parentPath = ast.findScopePath(path);
    const parent = parentPath ? parentPath.node : path.node;
    if (!parent.loc) return this.start;

    return Position.fromAST(parent.loc.start);
  }
}

type IndentationLevel = number;
