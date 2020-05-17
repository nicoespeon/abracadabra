import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { convertLetToConst } from "./convert-let-to-const";

describe("Convert Let To Const", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should convert let to const",
    [
      {
        description: "non-mutated variable declared as let converts to const",
        code: `{
  let someVariable = 'value';
  return someVariable;
}`,
        expected: `{
  const someVariable = 'value';
  return someVariable;
}`
      },
      {
        description:
          "multiple non-mutated variables declared as let convert to const",
        code: `{
  let someVariable, otherVariable = 'value';
  return someVariable;
}`,
        expected: `{
  const someVariable, otherVariable = 'value';
  return someVariable;
}`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doConvertLetToConst(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doConvertLetToConst(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFindLetToConvertToConst
    );
  });

  async function doConvertLetToConst(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await convertLetToConst(code, selection, editor);
    return editor.code;
  }
});
