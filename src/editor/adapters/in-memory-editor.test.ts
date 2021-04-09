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
});
