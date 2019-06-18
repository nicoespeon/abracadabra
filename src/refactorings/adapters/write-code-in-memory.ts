import { Write, Code } from "../i-write-code";

export { createWriteInMemory };

function createWriteInMemory(code: Code): [Write, () => Code] {
  const LINE_SEPARATOR = "\n";
  const CHARS_SEPARATOR = "";
  const codeMatrix: CodeMatrix = code
    .split(LINE_SEPARATOR)
    .map(line => line.split(CHARS_SEPARATOR));

  return [
    updates => {
      updates.forEach(({ code, selection }) => {
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
    () =>
      codeMatrix
        .map(line => line.join(CHARS_SEPARATOR))
        // Get rid of deleted lines
        .filter(line => line !== "")
        .join(LINE_SEPARATOR)
  ];
}

type CodeMatrix = Line[];
type Line = Char[];
type Char = string;
