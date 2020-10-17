import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { extractClass } from "./extract-class";

describe("Extract Class", () => {
  testEach<{ code: Code; expected: Code }>(
    "should extract class",
    [
      // TODO: write successful test cases here https://github.com/nicoespeon/abracadabra/issues/180
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await extractClass(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await extractClass(editor);

    expect(editor.showError).toBeCalledWith(ErrorReason.CanNotExtractClass);
  });
});
