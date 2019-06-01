import { Selection } from "./selection";

export type WriteUpdates = (updates: Update[]) => Promise<void>;

export interface Update {
  code: Code;
  selection: Selection;
}

export type Code = string;
