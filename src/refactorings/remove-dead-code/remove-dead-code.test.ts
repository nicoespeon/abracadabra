import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { removeDeadCode } from "./remove-dead-code";

describe("Remove Dead Code", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should remove dead code",
    [
      {
        description: "if(false)",
        code: `console.log("I'm alive");
if (false) {
  console.log("I'm dead");
}`,
        expected: `console.log("I'm alive");`
      }
    ],
    async ({ code, selection = Selection.cursorAt(1, 0), expected }) => {
      const result = await doRemoveDeadCode(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doRemoveDeadCode(code, selection);

    expect(showErrorMessage).toBeCalledWith(ErrorReason.DidNotFoundDeadCode);
  });

  async function doRemoveDeadCode(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await removeDeadCode(code, selection, editor);
    return editor.code;
  }
});
