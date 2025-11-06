import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code } from "../../../editor/editor";
import { extractVariable } from "./extract-variable";

describe("Extract Variable - Variable name", () => {
  it("should infer variable name for a string literal", async () => {
    await shouldExtractVariable({
      code: `console.log([cursor]"Hello world!");`,
      expected: `const helloWorld = "Hello world!";
console.log(helloWorld);`
    });
  });

  it("should infer variable name for a name that would be 20 characters", async () => {
    await shouldExtractVariable({
      code: `console.log([cursor]"Hello world, how do you do?");`,
      expected: `const helloWorldHowDoYouDo = "Hello world, how do you do?";
console.log(helloWorldHowDoYouDo);`
    });
  });

  it("should default on 'extracted' for a name that would be bigger than 20 characters", async () => {
    await shouldExtractVariable({
      code: `console.log([cursor]"Hello world, how do you do? -N");`,
      expected: `const extracted = "Hello world, how do you do? -N";
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
    selection: editor.selection
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
