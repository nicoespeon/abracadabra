import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { wrapInFunctionCall } from "./wrap-in-function-call";

describe("Wrap In Function Call", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should wrap in function call",
    [
      {
        description: "primitive",
        code: 'const a = "foo";',
        expected: 'const a = wrapped("foo");'
      },
      {
        description: "object",
        code: 'const a = { foo: "bar" };',
        expected: `const a = wrapped({
  foo: "bar"
});`
      },
      {
        description: "call expression",
        code: 'const a = fn({ foo: "bar" });',
        expected: 'const a = wrapped(fn({ foo: "bar" }));'
      },
      {
        description: "call expression (method with object selected)",
        code: 'const a = window.confirm("are you sure?");',
        // TODO: not sure about this one
        expected: 'const a = wrapped(window).confirm("are you sure?");'
        // or this?
        // expected: 'const a = wrapped(window.confirm("are you sure?"));'
      },
      {
        description: "call expression (method with member selected)",
        code: 'const a = window.confirm("are you sure?");',
        expected: 'const a = wrapped(window.confirm("are you sure?"));',
        selection: Selection.cursorAt(0, 17)
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 10), expected }) => {
      const result = await doWrapInFunctionCall(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doWrapInFunctionCall(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFindExpressionToWrap
    );
  });

  async function doWrapInFunctionCall(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await wrapInFunctionCall(code, selection, editor);
    return editor.code;
  }
});
