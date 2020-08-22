import { Code } from "../../../editor/editor";
import { Position } from "../../../editor/position";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { extractVariable } from "./extract-variable";

describe("Extract Variable - Template Literals we can extract", () => {
  testEach<{
    code: Code;
    expected: Code | { code: Code; position: Position };
  }>(
    "should extract",
    [
      {
        description: "a template literal when cursor is on a subpart of it",
        code: "console.log(`He[cursor]llo ${world}! How are you doing?`);",
        expected: `const extracted = \`Hello \${world}! How are you doing?\`;
console.log(extracted);`
      },
      {
        description: "a selected part of a template literal",
        code: "console.log(`Hello [start]world[end]! How are you doing?`);",
        expected: {
          code: `const world = "world";
console.log(\`Hello \${world}! How are you doing?\`);`,
          position: new Position(1, 21)
        }
      },
      {
        description: "a selected part of a template literal with expressions",
        code:
          "console.log(`${hello} [start]world[end]! How are ${you} doing?`);",
        expected: {
          code: `const world = "world";
console.log(\`\${hello} \${world}! How are \${you} doing?\`);`,
          position: new Position(1, 24)
        }
      },
      {
        description: "a selected expression of a template literal",
        code:
          "console.log(`${[start]he[end]llo} world! How are ${you} doing?`);",
        expected: `const extracted = hello;
console.log(\`\${extracted} world! How are \${you} doing?\`);`
      },
      {
        description:
          "a selected template literal (selection across quasi and expression)",
        code:
          "console.log(`${hell[start]o} wor[end]ld! How are ${you} doing?`);",
        expected: `const extracted = \`\${hello} world! How are \${you} doing?\`;
console.log(extracted);`
      },
      {
        description:
          "a selected template literal (selection over expression braces)",
        code:
          "console.log(`$[start]{he[end]llo} world! How are ${you} doing?`);",
        expected: `const extracted = \`\${hello} world! How are \${you} doing?\`;
console.log(extracted);`
      },
      {
        description:
          "a selected template literal (selection over template bounds)",
        code:
          "console.log({ text:[start] `${hel[end]lo} world! How are ${you} doing?` });",
        expected: `const extracted = { text: \`\${hello} world! How are \${you} doing?\` };
console.log(extracted);`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await extractVariable(editor);

      if (typeof expected === "object") {
        expect(editor.code).toBe(expected.code);
        expect(editor.position).toStrictEqual(expected.position);
      } else {
        expect(editor.code).toBe(expected);
      }
    }
  );

  testEach<{ code: Code; expected: Code }>(
    "should not extract a subset but the whole string",
    [
      {
        description: "from a multi-line template literal",
        code: `console.log(\`Hello world!
How are [start]you[end] doing?
All right!\`);`,
        expected: `const extracted = \`Hello world!
How are you doing?
All right!\`;
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
