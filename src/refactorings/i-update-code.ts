import { Selection } from "./selection";

export { UpdateWith };
export { Update, Code };

type UpdateWith = (
  selection: Selection,
  getUpdates: (code: Code) => Update[]
) => Promise<void>;

interface Update {
  code: Code;
  selection: Selection;
}

type Code = string;
