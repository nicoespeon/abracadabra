export type WriteUpdates = (updates: Update[]) => void;

export interface Update {
  code: Code;
  selection: Selection;
}

export type Code = string;

export interface Selection {
  start: Position;
  end: Position;
}

export interface Position {
  line: number;
  character: number;
}
