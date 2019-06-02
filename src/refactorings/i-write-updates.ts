import { Selection } from "./selection";

export { WriteUpdates, GetCode };
export { Update, Code };

type WriteUpdates = (updates: Update[]) => Promise<void>;

type GetCode = (selection: Selection) => Code;

interface Update {
  code: Code;
  selection: Selection;
}

type Code = string;
