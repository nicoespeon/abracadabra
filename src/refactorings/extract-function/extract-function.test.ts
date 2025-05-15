import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { extractFunction } from "./extract-function";

describe("Extract Function", () => {
  it("should delegate the work to the editor", () => {
    const { code, selection } = new InMemoryEditor();

    const result = extractFunction({
      state: "new",
      code,
      selection
    });

    expect(result).toEqual({
      action: "delegate",
      command: "extract function"
    });
  });

  it("should show an error if the editor does not support the refactoring", () => {
    const { code, selection } = new InMemoryEditor();

    const result = extractFunction({
      state: "command not supported",
      code,
      selection
    });

    expect(result).toEqual({
      action: "show error",
      reason: "I didn't find code to be extracted from current selection 🤔"
    });
  });
});
