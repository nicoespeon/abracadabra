import { Position } from "./position";
import { NodePath } from "./ast";

export class Selection {
  private _start: Position;
  private _end: Position;

  constructor([startLine, startChar]: number[], [endLine, endChar]: number[]) {
    this._start = new Position(startLine, startChar);
    this._end = new Position(endLine, endChar);
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
   *
   * We consider the default indentation level to be 0. May not be true,
   * but so far it works.
   */
  findIndentationLevel(
    path: NodePath,
    currentIndentationLevel: number = 0
  ): IndentationLevel {
    const { parent, parentPath } = path;

    if (
      !parent.loc ||
      !this.start.isSameLineThan(Position.fromAST(parent.loc.start))
    ) {
      return currentIndentationLevel;
    }

    return this.findIndentationLevel(parentPath, parent.loc.start.column);
  }
}

type IndentationLevel = number;
