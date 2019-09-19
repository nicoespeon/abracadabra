import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { convertForToForeach } from "./convert-for-to-foreach";

describe("Convert For To Foreach", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should convert for to foreach",
    [
      {
        description: "basic for-loop",
        code: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
}`,
        expected: `items.forEach(item => {
  console.log(item);
});`
      },
      {
        description: "for-loop with member expressions we can't replace",
        code: `for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
  console.log(items[3]);
}`,
        expected: `items.forEach(item => {
  console.log(item);
  console.log(items[3]);
});`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doConvertForToForeach(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doConvertForToForeach(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundForLoopToConvert
    );
  });

  async function doConvertForToForeach(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await convertForToForeach(code, selection, editor);
    return editor.code;
  }
});
