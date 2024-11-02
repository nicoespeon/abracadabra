import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { Code } from "../../../editor/editor";
import { Position } from "../../../editor/position";
import { testEach } from "../../../tests-helpers";
import { extractVariable } from "./extract-variable";

describe("Extract Variable - String Literals we can extract", () => {
  testEach<{
    code: Code;
    expected: Code | { code: Code; position: Position };
  }>(
    "should extract",
    [
      {
        description: "a string",
        code: `console.log([cursor]"Hello!");`,
        expected: `const hello = "Hello!";
console.log(hello);`
      },
      {
        description: "a string that starts with a number",
        code: `console.log([cursor]"2019-01-01");`,
        expected: `const extracted = "2019-01-01";
console.log(extracted);`
      },
      {
        description: "an empty string",
        code: `console.log([cursor]"");`,
        expected: `const extracted = "";
console.log(extracted);`
      },
      {
        description: "a 1-char string",
        code: `console.log([cursor]"T");`,
        expected: `const extracted = "T";
console.log(extracted);`
      },
      {
        description: "a string being a keyword",
        code: `console.log([cursor]"const");`,
        expected: `const extracted = "const";
console.log(extracted);`
      },
      {
        description: "a string without chars inside",
        code: `console.log([cursor]"===");`,
        expected: `const extracted = "===";
console.log(extracted);`
      },
      {
        description: "a selected part of a string literal",
        code: "console.log('Hello [start]world[end]! How are you doing?');",
        expected: {
          code: `const world = "world";
console.log(\`Hello \${world}! How are you doing?\`);`,
          position: new Position(1, 21)
        }
      },
      {
        description: "a selected part of a string literal in a JSX Attribute",
        code: `function Hello() {
  return <World name="[start]John[end] Doe" />
}`,
        expected: `function Hello() {
  const john = "John";
  return <World name={\`$\{john} Doe\`} />
}`
      },
      {
        description:
          "a selected part of a string literal in a JSX Expression Container",
        code: `function Hello() {
  return <World name={"[start]John[end] Doe"} />
}`,
        expected: `function Hello() {
  const john = "John";
  return <World name={\`$\{john} Doe\`} />
}`
      },
      {
        description: "a selected string literal (selection over string bounds)",
        code: "console.log([start]'Hello world! [end]How are you doing?');",
        expected: `const extracted = 'Hello world! How are you doing?';
console.log(extracted);`
      },
      {
        description: "a string that would shadow existing variable",
        code: `function brokenScenario(extracted, hello) {
  console.log("hello[cursor]", extracted, hello);
}`,
        expected: `function brokenScenario(extracted, hello) {
  const extracted1 = "hello";
  console.log(extracted1, extracted, hello);
}`
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
});
