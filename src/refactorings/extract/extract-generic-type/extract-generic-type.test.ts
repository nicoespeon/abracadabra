import { Editor, ErrorReason, Code } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";

import { extractGenericType } from "./extract-generic-type";

describe("Extract Generic Type", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  it("should not extract generic type if not in a valid pattern", async () => {
    const code = `let message: string = "Hello"`;
    const selection = Selection.cursorAt(0, 16);

    const result = await doExtractGenericType(code, selection);

    expect(result).toBe(code);
  });

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doExtractGenericType(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFindExtractableCode
    );
  });

  async function doExtractGenericType(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    jest
      .spyOn(editor, "askUser")
      .mockImplementation(([_, selectedOccurrence]) =>
        Promise.resolve(selectedOccurrence)
      );
    editor.showError = showErrorMessage;
    await extractGenericType(code, selection, editor);
    return editor.code;
  }
});
