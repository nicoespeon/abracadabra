import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code } from "../../../editor/editor";
import { extractVariable } from "./extract-variable";

describe("Extract Variable - Basic extraction behaviour", () => {
  it("should update code with extractable selection", async () => {
    await shouldExtractVariable({
      code: `console.log([cursor]"Hello!");`,
      expected: `const hello = "Hello!";
console.log(hello);`
    });
  });

  it("should expand selection to the nearest extractable code", async () => {
    await shouldExtractVariable({
      code: `console.log("He[cursor]llo!");`,
      expected: `const hello = "Hello!";
console.log(hello);`
    });
  });

  it("should rename extracted symbol", () => {
    const editor = new InMemoryEditor(`console.log([cursor]"Hello!");`);
    const result = extractVariable({
      state: "new",
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });

    expect(result).toMatchObject({
      action: "read then write",
      thenRun: expect.any(Function)
    });
  });

  it("should extract with correct indentation", async () => {
    await shouldExtractVariable({
      code: `    function sayHello() {
      console.log([cursor]"Hello!");
    }`,
      expected: `    function sayHello() {
      const hello = "Hello!";
      console.log(hello);
    }`
    });
  });

  it("should extract above the leading comments", async () => {
    await shouldExtractVariable({
      code: `// This is a comment
/**
 * Extracted variable should be above the leading comments.
 */
console.log([cursor]"Hello!");`,
      expected: `const hello = "Hello!";
// This is a comment
/**
 * Extracted variable should be above the leading comments.
 */
console.log(hello);`
    });
  });

  describe("invalid selection", () => {
    it("should show an error message", () => {
      const editor = new InMemoryEditor(`console.lo[cursor]g("Hello!");`);
      const result = extractVariable({
        state: "new",
        code: editor.code,
        selection: editor.selection,
        highlightSources: []
      });

      expect(result.action).toBe("show error");
    });
  });
});

async function shouldExtractVariable({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = extractVariable({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  if (result.action !== "read then write") {
    throw new Error(`Expected "read then write" but got "${result.action}"`);
  }

  const testEditor = new InMemoryEditor(editor.code);
  await testEditor.readThenWrite(
    result.readSelection,
    result.getModifications,
    result.newCursorPosition
  );

  expect(testEditor.code).toBe(expected);
}
