import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { addNumericSeparator } from "./add-numeric-separator";

describe("Add Numeric Separator", () => {
  testEach<{ code: Code; expected: Code }>(
    "should add numeric separator",
    [
      {
        description: "to distinct each group",
        code: `console.log([cursor]1234567890)`,
        expected: `console.log(1_234_567_890)`
      },
      {
        description: "to the selected number only",
        code: `console.log([cursor]1234567890);
console.log(1234567890);`,
        expected: `console.log(1_234_567_890);
console.log(1234567890);`
      },
      {
        description: "to the decimal part only",
        code: `console.log([cursor]1234567890.9876);`,
        expected: `console.log(1_234_567_890.9876);`
      },
      {
        description: "to a negative numeric literal",
        code: `console.log(-123456[cursor]7890.9876);`,
        expected: `console.log(-1_234_567_890.9876);`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await addNumericSeparator(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should not change a number that has less than 3 chars", async () => {
    const editor = new InMemoryEditor(`console.log([cursor]123)`);

    await addNumericSeparator(editor);

    expect(editor.code).toBe(`console.log(123)`);
  });

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await addNumericSeparator(editor);

    expect(editor.showError).toHaveBeenCalledWith(
      ErrorReason.DidNotFindNumericLiteral
    );
  });
});
