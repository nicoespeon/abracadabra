import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { renameSymbol } from "./rename-symbol";

describe("Rename Symbol", () => {
  it("should delegate the work to the editor", () => {
    const { code, selection } = new InMemoryEditor();

    const result = renameSymbol({
      state: "new",
      code,
      selection
    });

    expect(result).toEqual({
      action: "delegate",
      command: "rename symbol"
    });
  });

  describe("rename not supported by editor", () => {
    it("should ask user for new name, using current one as default", () => {
      const { code, selection } = new InMemoryEditor(
        "const [cursor]hello = 'world'"
      );

      const result = renameSymbol({
        state: "command not supported",
        code,
        selection
      });

      expect(result).toEqual({ action: "ask user input", value: "hello" });
    });

    it("should not ask user for new name if cursor isn't on an Identifier", () => {
      const { code, selection } = new InMemoryEditor(
        "const hello = 'w[cursor]orld'"
      );

      const result = renameSymbol({
        state: "command not supported",
        code,
        selection
      });

      expect(result.action).toBe("show error");
    });

    it("renames identifier with user input", () => {
      const { code, selection } = new InMemoryEditor(
        "const [cursor]hello = 'world'"
      );

      const result = renameSymbol({
        state: "user input response",
        value: "aBrandNewName",
        code,
        selection
      });

      expect(result).toEqual({
        action: "write",
        code: "const aBrandNewName = 'world'"
      });
    });

    it("doesn't rename if user returns no input", () => {
      const { code, selection } = new InMemoryEditor(
        "const [cursor]hello = 'world'"
      );

      const result = renameSymbol({
        state: "user input response",
        code,
        selection,
        value: undefined
      });

      expect(result).toEqual({ action: "do nothing" });
    });

    it("doesn't rename if user returns the same name", () => {
      const { code, selection } = new InMemoryEditor(
        "const [cursor]hello = 'world'"
      );

      const result = renameSymbol({
        state: "user input response",
        code,
        selection,
        value: "hello"
      });

      expect(result.action).toBe("show error");
    });

    it("renames all occurrences with user input", () => {
      const { code, selection } = new InMemoryEditor(`const hello = 'world';
console.log([cursor]hello);
const goodMorning = \`Good morning \${hello}!\``);

      const result = renameSymbol({
        state: "user input response",
        value: "aBrandNewName",
        code,
        selection
      });

      expect(result).toEqual({
        action: "write",
        code: `const aBrandNewName = 'world';
console.log(aBrandNewName);
const goodMorning = \`Good morning \${aBrandNewName}!\``
      });
    });

    it("renames destructured variable correctly (shorthand)", () => {
      const { code, selection } =
        new InMemoryEditor(`const { value[cursor] } = { value: 2 };
console.log(value);`);

      const result = renameSymbol({
        state: "user input response",
        value: "aBrandNewName",
        code,
        selection
      });

      expect(result).toEqual({
        action: "write",
        code: `const { value: aBrandNewName } = { value: 2 };
console.log(aBrandNewName);`
      });
    });

    it("renames destructured variable correctly (cursor on value)", () => {
      const { code, selection } =
        new InMemoryEditor(`const { value: somethingElse[cursor] } = { value: 2 };
console.log(somethingElse);`);

      const result = renameSymbol({
        state: "user input response",
        value: "aBrandNewName",
        code,
        selection
      });

      expect(result).toEqual({
        action: "write",
        code: `const { value: aBrandNewName } = { value: 2 };
console.log(aBrandNewName);`
      });
    });

    // We don't handle renaming object properties keys for the moment.
    // As we delegate work to babel, it would be nice to upgrade babel first. Maybe they handle it in recent versions.
    it("doesn't rename destructured variable if cursor on key", () => {
      const { code, selection } =
        new InMemoryEditor(`const { value[cursor]: somethingElse } = { value: 2 };
console.log(somethingElse);`);

      const result = renameSymbol({
        state: "user input response",
        value: "aBrandNewName",
        code,
        selection
      });

      expect(result.action).toBe("show error");
    });

    it("doesn't rename object property key", () => {
      const { code, selection } =
        new InMemoryEditor(`const { value } = { value[cursor]: 2 };
console.log(value);`);

      const result = renameSymbol({
        state: "user input response",
        value: "aBrandNewName",
        code,
        selection
      });

      expect(result.action).toBe("show error");
    });

    it("doesn't rename occurrences that are not in the same scope", () => {
      const { code, selection } = new InMemoryEditor(`function sayHello() {
  const hello = 'world';
  console.log([cursor]hello);
}

let hello = 'my friend';
const goodMorning = \`Good morning \${hello}!\``);

      const result = renameSymbol({
        state: "user input response",
        value: "aBrandNewName",
        code,
        selection
      });

      expect(result).toEqual({
        action: "write",
        code: `function sayHello() {
  const aBrandNewName = 'world';
  console.log(aBrandNewName);
}

let hello = 'my friend';
const goodMorning = \`Good morning \${hello}!\``
      });
    });

    it("doesn't rename occurrences that are shadow", () => {
      const { code, selection } =
        new InMemoryEditor(`let hello[cursor] = 'friends';

function sayHello() {
  const hello = 'world';
  console.log(hello);
}`);

      const result = renameSymbol({
        state: "user input response",
        value: "aBrandNewName",
        code,
        selection
      });

      expect(result).toEqual({
        action: "write",
        code: `let aBrandNewName = 'friends';

function sayHello() {
  const hello = 'world';
  console.log(hello);
}`
      });
    });

    it("preserves tabs", () => {
      const { code, selection } = new InMemoryEditor(`const hello = 'world';
\t\tconsole.log([cursor]hello);
\t\tconst goodMorning = \`Good morning \${hello}!\``);

      const result = renameSymbol({
        state: "user input response",
        value: "aBrandNewName",
        code,
        selection
      });

      expect(result).toEqual({
        action: "write",
        code: `const aBrandNewName = 'world';
\t\tconsole.log(aBrandNewName);
\t\tconst goodMorning = \`Good morning \${aBrandNewName}!\``
      });
    });
  });
});
