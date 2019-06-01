import { Position } from "./position";

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

  putCursorAtLineStart(): Selection {
    return new Selection([this.start.line, 0], [this.start.line, 0]);
  }
}
