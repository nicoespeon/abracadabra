import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code } from "../../../editor/editor";
import { extractVariable } from "./extract-variable";

describe("Extract Variable - Template Literals we can extract", () => {
  describe("should extract", () => {
    it("a template literal when cursor is on a subpart of it", async () => {
      await shouldExtractVariable({
        code: "console.log(`He[cursor]llo ${world}! How are you doing?`);",
        expected: `const extracted = \`Hello \${world}! How are you doing?\`;
console.log(extracted);`
      });
    });

    it("a selected part of a template literal", async () => {
      await shouldExtractVariable({
        code: "console.log(`Hello [start]world[end]! How are you doing?`);",
        expected: `const world = "world";
console.log(\`Hello \${world}! How are you doing?\`);`
      });
    });

    it("a selected part of a template literal with expressions", async () => {
      await shouldExtractVariable({
        code: "console.log(`${hello} [start]world[end]! How are ${you} doing?`);",
        expected: `const world = "world";
console.log(\`\${hello} \${world}! How are \${you} doing?\`);`
      });
    });

    it("a selected expression of a template literal", async () => {
      await shouldExtractVariable({
        code: "console.log(`${[start]he[end]llo} world! How are ${you} doing?`);",
        expected: `const extracted = hello;
console.log(\`\${extracted} world! How are \${you} doing?\`);`
      });
    });

    it("a selected template literal (selection across quasi and expression)", async () => {
      await shouldExtractVariable({
        code: "console.log(`${hell[start]o} wor[end]ld! How are ${you} doing?`);",
        expected: `const extracted = \`\${hello} world! How are \${you} doing?\`;
console.log(extracted);`
      });
    });

    it("a selected template literal (selection over expression braces)", async () => {
      await shouldExtractVariable({
        code: "console.log(`$[start]{he[end]llo} world! How are ${you} doing?`);",
        expected: `const extracted = \`\${hello} world! How are \${you} doing?\`;
console.log(extracted);`
      });
    });

    it("a selected template literal (selection over template bounds)", async () => {
      await shouldExtractVariable({
        code: "console.log({ text:[start] `${hel[end]lo} world! How are ${you} doing?` });",
        expected: `const extracted = { text: \`\${hello} world! How are \${you} doing?\` };
console.log(extracted);`
      });
    });
  });

  it("should not extract a subset but the whole string from a multi-line template literal", async () => {
    await shouldExtractVariable({
      code: `console.log(\`Hello world!
How are [start]you[end] doing?
All right!\`);`,
      expected: `const extracted = \`Hello world!
How are you doing?
All right!\`;
console.log(extracted);`
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
