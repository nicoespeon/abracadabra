import { Command, ErrorReason } from "../../../editor/editor";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";

import { extractVariable } from "./extract-variable";

describe("Extract Variable - Basic extraction behaviour", () => {
  it("should update code with extractable selection", async () => {
    const editor = new InMemoryEditor(`console.log([cursor]"Hello!");`);

    await extractVariable(editor);

    expect(editor.code).toBe(`const hello = "Hello!";
console.log(hello);`);
  });

  it("should expand selection to the nearest extractable code", async () => {
    const editor = new InMemoryEditor(`console.log("He[cursor]llo!");`);

    await extractVariable(editor);

    expect(editor.code).toBe(`const hello = "Hello!";
console.log(hello);`);
  });

  it("should rename extracted symbol", async () => {
    const editor = new InMemoryEditor(`console.log([cursor]"Hello!");`);
    jest.spyOn(editor, "delegate");

    await extractVariable(editor);

    expect(editor.delegate).toHaveBeenCalledTimes(1);
    expect(editor.delegate).toHaveBeenCalledWith(Command.RenameSymbol);
  });

  it("should extract with correct indentation", async () => {
    const code = `    function sayHello() {
      console.log([cursor]"Hello!");
    }`;
    const editor = new InMemoryEditor(code);

    await extractVariable(editor);

    expect(editor.code).toBe(`    function sayHello() {
      const hello = "Hello!";
      console.log(hello);
    }`);
  });

  it("should extract above the leading comments", async () => {
    const code = `// This is a comment
/**
 * Extracted variable should be above the leading comments.
 */
console.log([cursor]"Hello!");`;
    const editor = new InMemoryEditor(code);

    await extractVariable(editor);

    expect(editor.code).toBe(`const hello = "Hello!";
// This is a comment
/**
 * Extracted variable should be above the leading comments.
 */
console.log(hello);`);
  });

  describe("invalid selection", () => {
    it("should not extract anything", async () => {
      const editor = new InMemoryEditor(`console.lo[cursor]g("Hello!");`);
      const originalCode = editor.code;

      await extractVariable(editor);

      expect(editor.code).toBe(originalCode);
    });

    it("should show an error message", async () => {
      const editor = new InMemoryEditor(`console.lo[cursor]g("Hello!");`);
      jest.spyOn(editor, "showError");

      await extractVariable(editor);

      expect(editor.showError).toHaveBeenCalledWith(
        ErrorReason.DidNotFindExtractableCode
      );
    });
  });
});
