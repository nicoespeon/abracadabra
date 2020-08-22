import { Code, ErrorReason } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { flipTernary } from "./flip-ternary";

describe("Flip Ternary", () => {
  testEach<{ code: Code; expected: Code }>(
    "should flip ternary",
    [
      {
        description: "basic scenario",
        code: `const hello = is[cursor]Morning ? "Good morning" : "Hello";`,
        expected: `const hello = !isMorning ? "Hello" : "Good morning";`
      },
      {
        description: "an already flipped ternary",
        code: `const hello = !i[cursor]sMorning ? "Hello" : "Good morning";`,
        expected: `const hello = isMorning ? "Good morning" : "Hello";`
      },
      {
        description: "a ternary with a binary expression",
        code: `const max = a > [cursor]b ? a : b;`,
        expected: `const max = a <= b ? b : a;`
      },
      {
        description: "nested, cursor on wrapper",
        code: `const hello = is[cursor]Morning
  ? isMonday ? "Good monday morning!" : "Good morning"
  : "Hello";`,
        expected: `const hello = !isMorning
  ? "Hello"
  : isMonday ? "Good monday morning!" : "Good morning";`
      },
      {
        description: "nested, cursor on nested",
        code: `const hello = isMorning
  ? isMonday ?[cursor] "Good monday morning!" : "Good morning"
  : "Hello";`,
        expected: `const hello = isMorning
  ? !isMonday ? "Good morning" : "Good monday morning!"
  : "Hello";`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await flipTernary(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if selection has no ternary", async () => {
    const code = `console.log("no ternary")`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await flipTernary(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindTernaryToFlip
    );
  });
});
