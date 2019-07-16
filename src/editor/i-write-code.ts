import { Selection } from "./selection";
import { Position } from "./position";

export { Write, ReadThenWrite };
export { Update, Code };

type Write = (code: Code, newCursorPosition?: Position) => Promise<void>;

type ReadThenWrite = (
  selection: Selection,
  getUpdates: (code: Code) => Update[]
) => Promise<void>;

interface Update {
  code: Code;
  selection: Selection;
}

type Code = string;
