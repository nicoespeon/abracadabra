import { ErrorReason, Code } from "../../../editor/editor";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { extractType } from "./extract-type";

describe("Extract Type", () => {
  testEach<{ code: Code; expected: Code }>(
    "should extract type",
    [
      {
        description: "basic scenario",
        code: `let something: number[cursor];`,
        expected: `type Extracted = number;
let something: Extracted;`
      },
      {
        description: "selected type only",
        code: `let something: number[cursor];
let somethingElse: string;`,
        expected: `type Extracted = number;
let something: Extracted;
let somethingElse: string;`
      },
      {
        description: "create interface if extracted type is an object",
        code: `let something: [start]{ hello: string; }[end];`,
        expected: `interface Extracted {
  hello: string;
}

let something: Extracted;`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await extractType(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await extractType(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindTypeToExtract
    );
  });
});