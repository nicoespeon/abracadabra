import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code } from "../../../editor/editor";
import { testEach } from "../../../tests-helpers";
import { extractVariable } from "./extract-variable";

describe("Extract Variable - Variable name", () => {
  testEach<{ code: Code; expected: Code }>(
    "should infer variable name for",
    [
      {
        description: "a string literal",
        code: `console.log([cursor]"Hello world!");`,
        expected: `const helloWorld = "Hello world!";
console.log(helloWorld);`
      },
      {
        description: "a name that would be 20 characters",
        code: `console.log([cursor]"Hello world, how do you do?");`,
        expected: `const helloWorldHowDoYouDo = "Hello world, how do you do?";
console.log(helloWorldHowDoYouDo);`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await extractVariable(editor);

      expect(editor.code).toBe(expected);
    }
  );

  testEach<{ code: Code; expected: Code }>(
    "should default on 'extracted' for",
    [
      {
        description: "a name that would be bigger than 20 characters",
        code: `console.log([cursor]"Hello world, how do you do? -N");`,
        expected: `const extracted = "Hello world, how do you do? -N";
console.log(extracted);`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await extractVariable(editor);

      expect(editor.code).toBe(expected);
    }
  );
});
