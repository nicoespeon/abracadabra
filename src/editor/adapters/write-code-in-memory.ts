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
  const DELETED_LINE = "___DELETED_LINE___";
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

      // Since we insert updates progressively as new elements, keep track
      // of them so we can indent properly.
      const previousUpdatesOnLine: { [key: number]: number } = {};
      getUpdates(read(readCodeMatrix)).forEach(({ code, selection }) => {
        const { start, end } = selection;

        if (!previousUpdatesOnLine[start.line]) {
          previousUpdatesOnLine[start.line] = 0;
        }

        if (start.line === end.line) {
          // Replace selected code with updated code.
          codeMatrix[start.line].splice(
            start.character + previousUpdatesOnLine[start.line],
            end.character - start.character,
            code
          );
        } else if (end.line > start.line) {
          // Replace selected code with updated code.
          codeMatrix[start.line].splice(
            start.character + previousUpdatesOnLine[start.line],
            codeMatrix[start.line].length - start.character,
            code
          );

          // Merge the rest of the last line.
          codeMatrix[start.line].push(
            ...codeMatrix[end.line].slice(end.character)
          );

          // Delete all lines in between selection
          for (let i = start.line + 1; i <= end.line; i++) {
            codeMatrix[i] = [DELETED_LINE];
          }
        }

        previousUpdatesOnLine[start.line] += 1;
      });

      return Promise.resolve();
    },
    () => read(codeMatrix)
  ];

  function read(codeMatrix: CodeMatrix): string {
    return codeMatrix
      .map(line => line.join(CHARS_SEPARATOR))
      .filter(line => line !== DELETED_LINE)
      .join(LINE_SEPARATOR);
  }
}

type CodeMatrix = Line[];
type Line = Char[];
type Char = string;
