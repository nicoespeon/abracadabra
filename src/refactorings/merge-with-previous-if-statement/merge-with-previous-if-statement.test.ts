import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { mergeWithPreviousIfStatement } from "./merge-with-previous-if-statement";

describe("Merge With Previous If Statement", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection: Selection; expected: Code }>(
    "should merge with previous if statement",
    [
      {
        description: "basic statement",
        code: `if (isValid) {
  doSomething();
}

doSomethingElse();`,
        selection: Selection.cursorAt(4, 0),
        expected: `if (isValid) {
  doSomething();

  doSomethingElse();
}`
      },
      {
        description: "if has no block statement",
        code: `if (isValid) doSomething();

doSomethingElse();`,
        selection: Selection.cursorAt(3, 0),
        expected: `if (isValid) {
  doSomething();

  doSomethingElse();
}`
      }
    ],
    async ({ code, selection, expected }) => {
      const result = await doMergeWithPreviousIfStatement(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doMergeWithPreviousIfStatement(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundStatementToMerge
    );
  });

  async function doMergeWithPreviousIfStatement(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await mergeWithPreviousIfStatement(code, selection, editor);
    return editor.code;
  }
});
