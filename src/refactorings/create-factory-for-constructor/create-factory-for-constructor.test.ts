import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { createFactoryForConstructor } from "./create-factory-for-constructor";

describe("Create Factory For Constructor", () => {
  testEach<{ code: Code; expected: Code }>(
    "should create factory for constructor",
    [
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await createFactoryForConstructor(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await createFactoryForConstructor(editor);

    expect(editor.showError).toBeCalledWith(ErrorReason.DidNotFindClass);
  });
});
