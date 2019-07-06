import { Write, Code } from "../editor/i-write-code";
import { Position } from "../editor/position";

export { createWriteInMemory };

function createWriteInMemory(
  code: Code,
  position: Position = new Position(0, 0)
): [Write, () => { code: Code; position: Position }] {
  return [
    (newCode, newPosition) => {
      code = newCode;
      if (newPosition) position = newPosition;
      return Promise.resolve();
    },
    () => ({ code, position })
  ];
}
