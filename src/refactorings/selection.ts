import { Position } from "./position";
import { Node, NodePath, Selection as ASTSelection } from "./ast";

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

  get start(): Position {
    return this._start;
  }

  get end(): Position {
    return this._end;
  }

  putCursorAtColumn(column: number): Selection {
    return new Selection([this.start.line, column], [this.start.line, column]);
  }

  /**
   * Recursively compare parent paths' position against selection start
   * to determine which one is the top-left. We consider this path's column to
   * be the indentation level of the selection.
   */
  findIndentationLevel(path: NodePath): IndentationLevel {
    // Consider 0 to be the default indentation level
    // => may not be true, but so far it works!
    const DEFAULT_INDENTATION_LEVEL = 0;

    const parent = this.findTopParent(path);
    if (!parent.loc) return DEFAULT_INDENTATION_LEVEL;

    return Position.fromAST(parent.loc.start).character;
  }

  isInside(selection: Selection): boolean {
    return (
      this.start.isAfter(selection.start) && this.end.isBefore(selection.end)
    );
  }

  private findTopParent(path: NodePath): Node {
    const { parentPath, node } = path;
    if (!parentPath) return node;

    const {
      node: { loc }
    } = parentPath;
    if (!loc) return node;

    const astStart = Position.fromAST(loc.start);
    if (!this.start.isSameLineThan(astStart)) return node;

    return this.findTopParent(parentPath);
  }
}

type IndentationLevel = number;
