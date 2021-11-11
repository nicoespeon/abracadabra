import { Code } from "../../../editor/editor";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { extractVariable } from "./extract-variable";

describe("Extract Variable - Patterns we can't extract", () => {
  testEach<{ code: Code }>(
    "should not extract",
    [
      {
        description: "a function declaration",
        code: `[start]function sayHello() {
  console.log("hello");
}[end]`
      },
      {
        description: "a class property identifier",
        code: `class Logger {
  [start]message[end] = "Hello!";
}`
      },
      {
        description: "the identifier from a variable declaration",
        code: `const [start]foo[end] = "bar";`
      },
      {
        description: "a type annotation",
        code: `const toto: s[cursor]tring = "";`
      },
      {
        description: "a generic type parameter instantiation",
        code: `useState<[start]"all" | "local"[end]>("all");`
      },
      {
        description: "a return statement with no argument",
        code: `function addNumbers(arr: number[]): number {
  return[cursor];
}`
      }
    ],
    async ({ code }) => {
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;

      await extractVariable(editor);

      expect(editor.code).toBe(originalCode);
    }
  );
});
