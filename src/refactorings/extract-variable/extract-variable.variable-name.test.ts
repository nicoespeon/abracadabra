import { Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { extractVariable } from "./extract-variable";

describe("Extract Variable - Variable name", () => {
  testEach<{ code: Code; expected: Code }>(
    "should infer variable name for",
    [
      {
        description: "a string literal",
        code: `console.log("Hello world!");`,
        expected: `const helloWorld = "Hello world!";
console.log(helloWorld);`
      }
    ],
    async ({ code, expected }) => {
      const selection = Selection.cursorAt(0, 12);
      const result = await doExtractVariable(code, selection);
      expect(result).toBe(expected);
    }
  );

  async function doExtractVariable(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    await extractVariable(code, selection, editor);
    return editor.code;
  }
});
