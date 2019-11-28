import { Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { Position } from "../../editor/position";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { extractVariable } from "./extract-variable";

describe("Extract Variable - Patterns we can't extract", () => {
  testEach<{ code: Code; selection: Selection }>(
    "should not extract",
    [
      {
        description: "a function declaration",
        code: `function sayHello() {
  console.log("hello");
}`,
        selection: new Selection([0, 0], [2, 1])
      },
      {
        description: "a class property identifier",
        code: `class Logger {
  message = "Hello!";
}`,
        selection: new Selection([1, 2], [1, 9])
      },
      {
        description: "the identifier from a variable declaration",
        code: `const foo = "bar";`,
        selection: new Selection([0, 6], [0, 9])
      },
      {
        description: "a type annotation",
        code: `const toto: string = "";`,
        selection: Selection.cursorAt(0, 13)
      }
    ],
    async ({ code, selection }) => {
      const result = await doExtractVariable(code, selection);

      expect(result.code).toBe(code);
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
