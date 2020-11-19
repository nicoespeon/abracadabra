import { Command, Result } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";

import { renameSymbol } from "./rename-symbol";

describe("Rename Symbol", () => {
  it("should delegate the work to the editor", async () => {
    const editor = new InMemoryEditor("");
    jest.spyOn(editor, "delegate");

    await renameSymbol(editor);

    expect(editor.delegate).toBeCalledWith(Command.RenameSymbol);
  });

  describe("rename not supported by editor", () => {
    it("should ask user for new name, using current one as default", async () => {
      const editor = new InMemoryEditor("const [cursor]hello = 'world'");
      jest.spyOn(editor, "delegate").mockResolvedValue(Result.NotSupported);
      jest.spyOn(editor, "askUserInput");

      await renameSymbol(editor);

      expect(editor.askUserInput).toBeCalledWith("hello");
    });

    it("should not ask user for new name if cursor isn't on an Identifier", async () => {
      const editor = new InMemoryEditor("const hello = 'w[cursor]orld'");
      jest.spyOn(editor, "delegate").mockResolvedValue(Result.NotSupported);
      jest.spyOn(editor, "askUserInput");

      await renameSymbol(editor);

      expect(editor.askUserInput).not.toBeCalled();
    });

    it("renames identifier with user input", async () => {
      const editor = new InMemoryEditor("const [cursor]hello = 'world'");
      jest.spyOn(editor, "delegate").mockResolvedValue(Result.NotSupported);
      jest.spyOn(editor, "askUserInput").mockResolvedValue("aBrandNewName");

      await renameSymbol(editor);

      expect(editor.code).toBe("const aBrandNewName = 'world'");
    });

    it("doesn't rename if user returns no input", async () => {
      const editor = new InMemoryEditor("const [cursor]hello = 'world'");
      jest.spyOn(editor, "delegate").mockResolvedValue(Result.NotSupported);
      jest.spyOn(editor, "askUserInput").mockResolvedValue(undefined);

      await renameSymbol(editor);

      expect(editor.code).toBe("const hello = 'world'");
    });

    it("doesn't rename if user returns the same name", async () => {
      const editor = new InMemoryEditor("const [cursor]hello = 'world'");
      jest.spyOn(editor, "delegate").mockResolvedValue(Result.NotSupported);
      jest.spyOn(editor, "askUserInput").mockResolvedValue("hello");

      await renameSymbol(editor);

      expect(editor.code).toBe("const hello = 'world'");
    });

    it("renames all occurrences with user input", async () => {
      const editor = new InMemoryEditor(`const hello = 'world';
console.log([cursor]hello);
const goodMorning = \`Good morning \${hello}!\``);
      jest.spyOn(editor, "delegate").mockResolvedValue(Result.NotSupported);
      jest.spyOn(editor, "askUserInput").mockResolvedValue("aBrandNewName");

      await renameSymbol(editor);

      expect(editor.code).toBe(`const aBrandNewName = 'world';
console.log(aBrandNewName);
const goodMorning = \`Good morning \${aBrandNewName}!\``);
    });

    it("renames destructured variable correctly (shorthand)", async () => {
      const editor = new InMemoryEditor(`const { value[cursor] } = { value: 2 };
console.log(value);`);
      jest.spyOn(editor, "delegate").mockResolvedValue(Result.NotSupported);
      jest.spyOn(editor, "askUserInput").mockResolvedValue("aBrandNewName");

      await renameSymbol(editor);

      expect(editor.code).toBe(`const { value: aBrandNewName } = { value: 2 };
console.log(aBrandNewName);`);
    });

    it("renames destructured variable correctly (cursor on value)", async () => {
      const editor = new InMemoryEditor(`const { value: somethingElse[cursor] } = { value: 2 };
console.log(somethingElse);`);
      jest.spyOn(editor, "delegate").mockResolvedValue(Result.NotSupported);
      jest.spyOn(editor, "askUserInput").mockResolvedValue("aBrandNewName");

      await renameSymbol(editor);

      expect(editor.code).toBe(`const { value: aBrandNewName } = { value: 2 };
console.log(aBrandNewName);`);
    });

    // We don't handle renaming object properties keys for the moment.
    // As we delegate work to babel, it would be nice to upgrade babel first. Maybe they handle it in recent versions.
    it("doesn't rename destructured variable if cursor on key", async () => {
      const editor = new InMemoryEditor(`const { value[cursor]: somethingElse } = { value: 2 };
console.log(somethingElse);`);
      jest.spyOn(editor, "delegate").mockResolvedValue(Result.NotSupported);
      jest.spyOn(editor, "askUserInput").mockResolvedValue("aBrandNewName");

      await renameSymbol(editor);

      expect(editor.code).toBe(`const { value: somethingElse } = { value: 2 };
console.log(somethingElse);`);
    });

    it("doesn't rename object property key", async () => {
      const editor = new InMemoryEditor(`const { value } = { value[cursor]: 2 };
console.log(value);`);
      jest.spyOn(editor, "delegate").mockResolvedValue(Result.NotSupported);
      jest.spyOn(editor, "askUserInput").mockResolvedValue("aBrandNewName");

      await renameSymbol(editor);

      expect(editor.code).toBe(`const { value } = { value: 2 };
console.log(value);`);
    });

    it("doesn't rename occurrences that are not in the same scope", async () => {
      const editor = new InMemoryEditor(`function sayHello() {
  const hello = 'world';
  console.log([cursor]hello);
}

let hello = 'my friend';
const goodMorning = \`Good morning \${hello}!\``);
      jest.spyOn(editor, "delegate").mockResolvedValue(Result.NotSupported);
      jest.spyOn(editor, "askUserInput").mockResolvedValue("aBrandNewName");

      await renameSymbol(editor);

      expect(editor.code).toBe(`function sayHello() {
  const aBrandNewName = 'world';
  console.log(aBrandNewName);
}

let hello = 'my friend';
const goodMorning = \`Good morning \${hello}!\``);
    });

    it("doesn't rename occurrences that are shadow", async () => {
      const editor = new InMemoryEditor(`let hello[cursor] = 'friends';

function sayHello() {
  const hello = 'world';
  console.log(hello);
}`);
      jest.spyOn(editor, "delegate").mockResolvedValue(Result.NotSupported);
      jest.spyOn(editor, "askUserInput").mockResolvedValue("aBrandNewName");

      await renameSymbol(editor);

      expect(editor.code).toBe(`let aBrandNewName = 'friends';

function sayHello() {
  const hello = 'world';
  console.log(hello);
}`);
    });
  });
});
