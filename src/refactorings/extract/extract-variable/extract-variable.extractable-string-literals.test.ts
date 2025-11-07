import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code } from "../../../editor/editor";
import { extractVariable } from "./extract-variable";

describe("Extract Variable - String Literals we can extract", () => {
  describe("should extract", () => {
    it("a string", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]"Hello!");`,
        expected: `const hello = "Hello!";
console.log(hello);`
      });
    });

    it("a string that starts with a number", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]"2019-01-01");`,
        expected: `const extracted = "2019-01-01";
console.log(extracted);`
      });
    });

    it("an empty string", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]"");`,
        expected: `const extracted = "";
console.log(extracted);`
      });
    });

    it("a 1-char string", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]"T");`,
        expected: `const extracted = "T";
console.log(extracted);`
      });
    });

    it("a string being a keyword", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]"const");`,
        expected: `const extracted = "const";
console.log(extracted);`
      });
    });

    it("a string without chars inside", async () => {
      await shouldExtractVariable({
        code: `console.log([cursor]"===");`,
        expected: `const extracted = "===";
console.log(extracted);`
      });
    });

    it("a selected part of a string literal", async () => {
      await shouldExtractVariable({
        code: "console.log('Hello [start]world[end]! How are you doing?');",
        expected: `const world = "world";
console.log(\`Hello \${world}! How are you doing?\`);`
      });
    });

    it("a selected part of a string literal in a JSX Attribute", async () => {
      await shouldExtractVariable({
        code: `function Hello() {
  return <World name="[start]John[end] Doe" />
}`,
        expected: `function Hello() {
  const john = "John";
  return <World name={\`$\{john} Doe\`} />
}`
      });
    });

    it("a selected part of a string literal in a JSX Expression Container", async () => {
      await shouldExtractVariable({
        code: `function Hello() {
  return <World name={"[start]John[end] Doe"} />
}`,
        expected: `function Hello() {
  const john = "John";
  return <World name={\`$\{john} Doe\`} />
}`
      });
    });

    it("a selected string literal (selection over string bounds)", async () => {
      await shouldExtractVariable({
        code: "console.log([start]'Hello world! [end]How are you doing?');",
        expected: `const extracted = 'Hello world! How are you doing?';
console.log(extracted);`
      });
    });

    it("a string that would shadow existing variable", async () => {
      await shouldExtractVariable({
        code: `function brokenScenario(extracted, hello) {
  console.log("hello[cursor]", extracted, hello);
}`,
        expected: `function brokenScenario(extracted, hello) {
  const extracted1 = "hello";
  console.log(extracted1, extracted, hello);
}`
      });
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

  const { code: expectedCode, selection: expectedSelection } =
    new InMemoryEditor(expected);

  const testEditor = new InMemoryEditor(editor.code);
  await testEditor.readThenWrite(
    result.readSelection,
    result.getModifications,
    result.newCursorPosition
  );

  expect(testEditor.code).toBe(expectedCode);

  if (!expectedSelection.isCursorAtTopOfDocument) {
    expect(result).toMatchObject({
      newCursorPosition: expectedSelection.start
    });
  }
}
