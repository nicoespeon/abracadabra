import { Selection } from "./selection";

export { WriteUpdates, Update, Code };

type WriteUpdates = (updates: Update[]) => Promise<void>;

interface Update {
  code: Code;
  selection: Selection;
}

type Code = string;
