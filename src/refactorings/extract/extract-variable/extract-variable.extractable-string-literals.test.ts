import { Code } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { Position } from "../../../editor/position";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { extractVariable } from "./extract-variable";

describe("Extract Variable - String Literals we can extract", () => {
  testEach<{
    code: Code;
    selection: Selection;
    expected: Code | { code: Code; position: Position };
  }>(
    "should extract",
    [
      {
        description: "a string",
        code: `console.log("Hello!");`,
        selection: Selection.cursorAt(0, 12),
        expected: `const hello = "Hello!";
console.log(hello);`
      },
      {
        description: "a string that starts with a number",
        code: `console.log("2019-01-01");`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = "2019-01-01";
console.log(extracted);`
      },
      {
        description: "an empty string",
        code: `console.log("");`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = "";
console.log(extracted);`
      },
      {
        description: "a 1-char string",
        code: `console.log("T");`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = "T";
console.log(extracted);`
      },
      {
        description: "a string being a keyword",
        code: `console.log("const");`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = "const";
console.log(extracted);`
      },
      {
        description: "a string without chars inside",
        code: `console.log("===");`,
        selection: Selection.cursorAt(0, 12),
        expected: `const extracted = "===";
console.log(extracted);`
      },
      {
        description: "a selected part of a string literal",
        code: "console.log('Hello world! How are you doing?');",
        selection: new Selection([0, 19], [0, 24]),
        expected: {
          code: `const world = "world";
console.log(\`Hello \${world}! How are you doing?\`);`,
          position: new Position(1, 21)
        }
      },
      {
        description: "a selected string literal (selection over string bounds)",
        code: "console.log('Hello world! How are you doing?');",
        selection: new Selection([0, 12], [0, 26]),
        expected: `const extracted = 'Hello world! How are you doing?';
console.log(extracted);`
      }
    ],
    async ({ code, selection, expected }) => {
      const result = await doExtractVariable(code, selection);

      if (typeof expected === "object") {
        // Use 2 assertions to have a more readable breakdown
        expect(result.code).toBe(expected.code);
        expect(result.position).toStrictEqual(expected.position);
      } else {
        expect(result.code).toBe(expected);
      }
    }
  );

  async function doExtractVariable(
    code: Code,
    selection: Selection
  ): Promise<{ code: Code; position: Position }> {
    const editor = new InMemoryEditor(code);
    await extractVariable(code, selection, editor);
    return { code: editor.code, position: editor.position };
  }
});
