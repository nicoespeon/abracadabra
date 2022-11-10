import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code, ErrorReason } from "../../editor/editor";
import { testEach } from "../../tests-helpers";

import { flipYodaCondition } from "./flip-yoda-condition";

describe("Flip Yoda Condition", () => {
  testEach<{ code: Code; expected: Code }>(
    "should flip yoda condition",
    [
      {
        description: "keep operator",
        code: `a ==[cursor] b`,
        expected: `b == a`
      },
      {
        description: "flip operator",
        code: `a >[cursor] b`,
        expected: `b < a`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await flipYodaCondition(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const editor = new InMemoryEditor(`a in[cursor] b`);
    jest.spyOn(editor, "showError");

    await flipYodaCondition(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindYodaCondition
    );
  });
});
