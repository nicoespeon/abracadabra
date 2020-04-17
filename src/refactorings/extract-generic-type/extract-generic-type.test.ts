import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { extractGenericType } from "./extract-generic-type";

describe("Extract Generic Type", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should extract generic type",
    [
      // TODO: write successful test cases here
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doExtractGenericType(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doExtractGenericType(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFindTypeToExtract
    );
  });

  async function doExtractGenericType(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await extractGenericType(code, selection, editor);
    return editor.code;
  }
});
