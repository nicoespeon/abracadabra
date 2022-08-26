import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { createClass } from "./create-class";

describe("Create Class", () => {
  testEach<{ code: Code; expected: Code }>(
    "should create class",
    [
      {
        description: "from undefined class",
        code: `new MyClass()`,
        expected: "class MyClass {}\nnew MyClass()"
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await createClass(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await createClass(editor);

    expect(editor.showError).toBeCalledWith(ErrorReason.CantCreateClass);
  });
});
