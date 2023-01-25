import { Position } from "../position";
import { InMemoryEditor } from "./in-memory-editor";

describe("InMemoryEditor", () => {
  it("should tell if given line is blank", () => {
    const editor = new InMemoryEditor(`// Irrelevant comment

`);

    expect(editor.isLineBlank(1)).toBe(true);
  });

  it("should tell if given line is not blank", () => {
    const editor = new InMemoryEditor(`// Irrelevant comment`);

    expect(editor.isLineBlank(0)).toBe(false);
  });

  it("should consider line full of spaces as a blank line", () => {
    const editor = new InMemoryEditor(`    \t\t`);

    expect(editor.isLineBlank(0)).toBe(true);
  });

  it("should remove given line", () => {
    const editor = new InMemoryEditor(`// Some comment

const hello = "world";`);

    editor.removeLine(1);

    expect(editor.code).toBe(`// Some comment
const hello = "world";`);
  });

  it("should insert inline code", () => {
    const editor = new InMemoryEditor(`// Some comment
const hello = "world";`);

    editor.insert(`// `, new Position(1, 0));

    expect(editor.code).toBe(`// Some comment
// const hello = "world";`);
  });

  it("should insert multi-lines code", () => {
    const editor = new InMemoryEditor(`// Some comment
const hello = "world";`);

    editor.insert(
      `// This assigns the variable
`,
      new Position(1, 0)
    );

    expect(editor.code).toBe(`// Some comment
// This assigns the variable
const hello = "world";`);
  });
});
