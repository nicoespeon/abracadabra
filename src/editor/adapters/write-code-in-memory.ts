import { Write, Code, ReadThenWrite } from "../i-write-code";
import { Position } from "../position";

export { createWriteInMemory, createReadThenWriteInMemory };

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

function createReadThenWriteInMemory(code: Code): [ReadThenWrite, () => Code] {
  const LINE_SEPARATOR = "\n";
  const CHARS_SEPARATOR = "";
  const codeMatrix: CodeMatrix = code
    .split(LINE_SEPARATOR)
    .map(line => line.split(CHARS_SEPARATOR));

  return [
    (selection, getUpdates) => {
      const { start, end } = selection;

      let readCodeMatrix: CodeMatrix = [];
      if (start.line === end.line) {
        readCodeMatrix = [
          codeMatrix[start.line].slice(start.character, end.character)
        ];
      } else if (end.line > start.line) {
        readCodeMatrix = [codeMatrix[start.line].slice(start.character)];

        // Keep all lines in between selection
        for (let i = start.line + 1; i < end.line; i++) {
          readCodeMatrix.push(codeMatrix[i]);
        }

        readCodeMatrix.push(codeMatrix[end.line].slice(0, end.character));
      }

      getUpdates(read(readCodeMatrix)).forEach(({ code, selection }) => {
        const { start, end } = selection;

        if (start.line === end.line) {
          // Replace selected code with updated code.
          codeMatrix[start.line].splice(
            start.character,
            end.character - start.character,
            code
          );
        } else if (end.line > start.line) {
          // Replace selected code with updated code.
          codeMatrix[start.line].splice(
            start.character,
            codeMatrix[start.line].length - start.character,
            code
          );

          // Delete all lines in between selection
          for (let i = start.line + 1; i < end.line; i++) {
            codeMatrix[i] = [];
          }

          codeMatrix[end.line].splice(0, end.character);
        }
      });

      return Promise.resolve();
    },
    () => read(codeMatrix)
  ];

  function read(codeMatrix: CodeMatrix): string {
    return (
      codeMatrix
        .map(line => line.join(CHARS_SEPARATOR))
        // Get rid of deleted lines
        .filter(line => line !== "")
        .join(LINE_SEPARATOR)
    );
  }
}

type CodeMatrix = Line[];
type Line = Char[];
type Char = string;
