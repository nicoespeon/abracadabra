import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code, ErrorReason } from "../../editor/editor";
import { testEach } from "../../tests-helpers";

import { flipOperator } from "./flip-operator";

describe("Flip Operator", () => {
  testEach<{ code: Code; expected: Code }>(
    "should flip operator",
    [
      {
        description: "loose equality",
        code: "a ==[cursor] b",
        expected: "b == a"
      },
      {
        description: "strict equality",
        code: "a ===[cursor] b",
        expected: "b === a"
      },
      {
        description: "loose inequality",
        code: "a !=[cursor] b",
        expected: "b != a"
      },
      {
        description: "strict inequality",
        code: "a !==[cursor] b",
        expected: "b !== a"
      },
      {
        description: "greather than",
        code: "a >[cursor] b",
        expected: "b < a"
      },
      {
        description: "lower than",
        code: "a <[cursor] b",
        expected: "b > a"
      },
      {
        description: "greater or equal",
        code: "a >=[cursor] b",
        expected: "b <= a"
      },
      {
        description: "lower or equal",
        code: "a <=[cursor] b",
        expected: "b >= a"
      },
      {
        description: "logical and",
        code: "a &&[cursor] b",
        expected: "b && a"
      },
      {
        description: "logical or",
        code: "a ||[cursor] b",
        expected: "b || a"
      },
      {
        description: "nested logical or, cursor on nested",
        code: "a && (b ||[cursor] c)",
        expected: "a && (c || b)"
      },
      {
        description: "nested logical or, cursor on wrapper",
        code: "a [cursor]&& (b || c)",
        expected: "(b || c) && (a)"
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await flipOperator(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const editor = new InMemoryEditor(`a in[cursor] b`);
    jest.spyOn(editor, "showError");

    await flipOperator(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindOperatorToFlip
    );
  });
});
