import { Selection } from "./selection";

export { WritableEditor };
export { Update, Code };

interface WritableEditor {
  write: (updates: Update[]) => Promise<void>;
  read: (selection: Selection) => Code;
}

interface Update {
  code: Code;
  selection: Selection;
}

type Code = string;
