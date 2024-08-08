import { ErrorReason } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";

import { extractGenericType } from "./extract-generic-type";

describe("Extract Generic Type", () => {
  it("should not extract generic type if not in a valid pattern", async () => {
    const code = `let message: str[cursor]ing = "Hello"`;
    const editor = new InMemoryEditor(code);
    const originalCode = editor.code;

    await extractGenericType(editor);

    expect(editor.code).toBe(originalCode);
  });

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await extractGenericType(editor);

    expect(editor.showError).toHaveBeenCalledWith(
      ErrorReason.DidNotFindExtractableCode
    );
  });
});
