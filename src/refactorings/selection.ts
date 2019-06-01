export interface Selection {
  start: Position;
  end: Position;
}

export interface Position {
  line: number;
  character: number;
}

export function createSelection(
  [startLine, startChar]: number[],
  [endLine, endChar]: number[]
): Selection {
  return {
    start: { line: startLine, character: startChar },
    end: { line: endLine, character: endChar }
  };
}
