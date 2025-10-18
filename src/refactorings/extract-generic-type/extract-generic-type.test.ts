import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { extractGenericType } from "./extract-generic-type";

describe("Extract Generic Type", () => {
  it("should not extract generic type if not in a valid pattern", () => {
    const code = `let message: str[cursor]ing = "Hello"`;
    const editor = new InMemoryEditor(code);
    const result = extractGenericType({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("show error");
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    const result = extractGenericType({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("show error");
  });
});
