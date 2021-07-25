import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { turnIntoGetter } from "./turn-into-getter";

describe("Turn Into Getter", () => {
  testEach<{ code: Code; expected: Code }>(
    "should turn into getter",
    [
      // TODO: write successful test cases here
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await turnIntoGetter(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await turnIntoGetter(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindMethodToConvert
    );
  });
});
