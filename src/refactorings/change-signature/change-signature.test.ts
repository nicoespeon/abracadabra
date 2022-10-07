import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { changeSignature } from "./change-signature";

describe("Change Signature", () => {
  testEach<{ code: Code; expected: Code }>(
    "should change signature",
    [
      // TODO: write successful test cases here
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await changeSignature(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await changeSignature(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.CantChangeSignatureException
    );
  });
});
