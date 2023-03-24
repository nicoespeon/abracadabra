import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { wrapInJsxFragment } from "./wrap-in-jsx-fragment";

describe("Wrap In Jsx Fragment", () => {
  testEach<{ code: Code; expected: Code }>(
    "should wrap in jsx fragment",
    [
      // TODO: write successful test cases here
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await wrapInJsxFragment(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await wrapInJsxFragment(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.CouldNotWrapInJsxFragment
    );
  });
});
