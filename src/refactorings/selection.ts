import { Position } from "./position";

export interface Selection {
  start: Position;
  end: Position;
}

export function createSelection(
  [startLine, startChar]: number[],
  [endLine, endChar]: number[]
): Selection {
  return {
    start: new Position(startLine, startChar),
    end: new Position(endLine, endChar)
  };
}
