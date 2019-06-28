import { Position } from "./position";

export { PutCursorAt };

type PutCursorAt = (position: Position) => Promise<void>;
