import { Code } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { Position } from "../../../editor/position";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { extractVariable } from "./extract-variable";

describe("Extract Variable - Template Literals we can extract", () => {
  testEach<{
    code: Code;
    selection: Selection;
    expected: Code | { code: Code; position: Position };
  }>(
    "should extract",
    [
      {
        description: "a template literal when cursor is on a subpart of it",
        code: "console.log(`Hello ${world}! How are you doing?`);",
        selection: Selection.cursorAt(0, 15),
        expected: `const extracted = \`Hello \${world}! How are you doing?\`;
console.log(extracted);`
      },
      {
        description: "a selected part of a template literal",
        code: "console.log(`Hello world! How are you doing?`);",
        selection: new Selection([0, 19], [0, 24]),
        expected: `const world = "world";
console.log(\`Hello \${world}! How are you doing?\`);`
      },
      {
        description: "a selected part of a template literal with expressions",
        code: "console.log(`${hello} world! How are ${you} doing?`);",
        selection: new Selection([0, 22], [0, 27]),
        expected: `const world = "world";
console.log(\`\${hello} \${world}! How are \${you} doing?\`);`
      },
      {
        description: "a selected expression of a template literal",
        code: "console.log(`${hello} world! How are ${you} doing?`);",
        selection: new Selection([0, 15], [0, 17]),
        expected: `const extracted = hello;
console.log(\`\${extracted} world! How are \${you} doing?\`);`
      },
      {
        description:
          "a selected template literal (selection across quasi and expression)",
        code: "console.log(`${hello} world! How are ${you} doing?`);",
        selection: new Selection([0, 19], [0, 25]),
        expected: `const extracted = \`\${hello} world! How are \${you} doing?\`;
console.log(extracted);`
      },
      {
        description:
          "a selected template literal (selection over expression braces)",
        code: "console.log(`${hello} world! How are ${you} doing?`);",
        selection: new Selection([0, 14], [0, 17]),
        expected: `const extracted = \`\${hello} world! How are \${you} doing?\`;
console.log(extracted);`
      },
      {
        description:
          "a selected template literal (selection over template bounds)",
        code: "console.log({ text: `${hello} world! How are ${you} doing?` });",
        selection: new Selection([0, 19], [0, 26]),
        expected: `const extracted = { text: \`\${hello} world! How are \${you} doing?\` };
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
