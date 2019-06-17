import { Selection } from "./selection";

export { UpdateWith, Write };
export { Update, Code };

type Write = (updates: Update[]) => Promise<void>;

// TODO: Get rid of this one, use `Write` only.
// => thanks to AST, we don't have to read code from editor before updating it.
type UpdateWith = (
  selection: Selection,
  getUpdates: (code: Code) => Update[]
) => Promise<void>;

interface Update {
  code: Code;
  selection: Selection;
}

type Code = string;
