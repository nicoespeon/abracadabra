import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { splitMultipleDeclarations } from "./split-multiple-declarations";

describe("Split Multiple Declarations", () => {
  testEach<{ code: Code; expected: Code }>(
    "should split multiple declarations",
    [
      // TODO: write successful test cases here
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await splitMultipleDeclarations(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await splitMultipleDeclarations(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindMultipleDeclarationsToSplit
    );
  });
});
